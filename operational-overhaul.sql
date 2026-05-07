-- ============================================================
-- Nusantara Academy — Final Operational Integrity Migration
-- ============================================================

-- 1. CHAT SYSTEM
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

-- 2. ENHANCED LMS (Multi-Type Questions)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS correct_answer TEXT, -- For Essays or Matching (JSON string)
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- For Matching/Complex MCQ details

-- 3. QUIZ SESSION PERSISTENCE
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

-- 4. OFFICIAL REPORTS (RAPOT)
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    attitude_score TEXT,
    extracurriculars JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FINANCE & WALLET SYNC
ALTER TABLE public.finance_bills 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 6. GRADEBOOK & ASSESSMENT
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
    target_id UUID NOT NULL, -- Quiz ID, Lesson ID, or Task ID
    target_type TEXT NOT NULL, -- 'quiz', 'lesson', 'offline'
    score FLOAT DEFAULT 0,
    is_graded BOOLEAN DEFAULT FALSE,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ,
    UNIQUE(student_id, category_id, target_id)
);

-- 7. ENABLE REALTIME REPLICATION
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.chat_messages, 
    public.chat_groups, 
    public.quiz_responses, 
    public.finance_bills, 
    public.wallets, 
    public.student_scores;
COMMIT;

-- 8. RLS POLICIES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read class messages" ON public.chat_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can send class messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own quiz responses" ON public.quiz_responses FOR ALL USING (auth.uid() = student_id);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TU manage all reports" ON public.report_cards FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tu'));
CREATE POLICY "Linked users view reports" ON public.report_cards FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.report_cards.student_id));

ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage categories" ON public.assessment_categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Anyone can read categories" ON public.assessment_categories FOR SELECT USING (true);

ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage all scores" ON public.student_scores FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu')));
CREATE POLICY "Students read own scores" ON public.student_scores FOR SELECT USING (auth.uid() = student_id);
