-- ============================================================
-- Nusantara Academy — Supreme Operational Integrity Migration
-- ============================================================

-- 1. CHAT & DIRECTORY SYSTEM
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('class', 'parent-teacher', 'announcement')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GRADEBOOK & AUTOMATED SCORING
CREATE TABLE IF NOT EXISTS public.assessment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.assessment_categories(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- Link to Quiz ID or Assignment ID
    target_type TEXT CHECK (target_type IN ('quiz', 'assignment', 'manual')),
    score FLOAT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store raw response refs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, category_id, target_id)
);

-- 3. RAPOT (OFFICIAL REPORT CARD) DATA
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    
    -- Homeroom Teacher Inputs
    attendance_sick INTEGER DEFAULT 0,
    attendance_excused INTEGER DEFAULT 0,
    attendance_unexcused INTEGER DEFAULT 0,
    homeroom_notes TEXT,
    attitude_spiritual TEXT,
    attitude_social TEXT,
    
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_card_extracurriculars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_card_id UUID REFERENCES public.report_cards(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    predicate TEXT, -- A, B, C, D
    description TEXT
);

-- 4. CBT ENGINE (INDUSTRIAL STANDARDS)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS correct_answer TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    time_left_seconds INTEGER NOT NULL,
    status TEXT DEFAULT 'ongoing',
    metadata JSONB DEFAULT '{}'::jsonb, -- stores flags, navigation history
    started_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, quiz_id)
);

-- 5. FINANCE INTEGRITY
-- Ensure wallet sync logic is absolute
ALTER TABLE public.finance_bills 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 6. ENABLE REALTIME REPLICATION
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.chat_messages, 
    public.chat_groups, 
    public.quiz_responses, 
    public.finance_bills, 
    public.wallets, 
    public.student_scores,
    public.exam_sessions;
COMMIT;

-- 7. RLS POLICIES (Data Mandate)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read class messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage scores" ON public.student_scores FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu')));
CREATE POLICY "Students can view own scores" ON public.student_scores FOR SELECT USING (auth.uid() = student_id);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Homeroom can manage report cards" ON public.report_cards FOR ALL USING (EXISTS (SELECT 1 FROM public.classes WHERE homeroom_teacher_id = auth.uid() AND id = public.report_cards.class_id));
CREATE POLICY "Students/Parents can view published report cards" ON public.report_cards FOR SELECT USING (is_published = true AND (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.report_cards.student_id)));

-- 8. INITIAL CLASS GROUPS SEEDING (Logic Helper)
-- This assumes classes exist and we want to ensure chat groups are ready
INSERT INTO public.chat_groups (name, type, class_id)
SELECT name, 'class', id FROM public.classes
ON CONFLICT DO NOTHING;
-- 9. UNIFIED FINANCIAL LEDGER
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance FLOAT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount FLOAT NOT NULL,
    type TEXT CHECK (type IN ('topup', 'canteen_payment', 'spp_payment', 'refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Students/Parents view linked wallet' ON public.wallets FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.wallets.student_id));
CREATE POLICY 'TU manage all wallets' ON public.wallets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tu'));

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY 'Users view linked transactions' ON public.wallet_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.wallets WHERE id = public.wallet_transactions.wallet_id AND (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.wallets.student_id))));
