-- ============================================================
-- Nusantara Academy — Operational Overhaul & Anti-Pajangan
-- ============================================================

-- 1. ENHANCED QUIZ QUESTIONS (Multi-Type)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS correct_answer TEXT, -- For Essays or Matching (JSON string)
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- For Matching/Complex MCQ details

-- 2. STUDENT RESPONSE PERSISTENCE (For Ragu-ragu/Flagging)
CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    is_flagged BOOLEAN DEFAULT FALSE, -- 'Ragu-ragu' status
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, question_id)
);

-- 3. ENHANCED LESSON MATERIALS
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS body_rich_text TEXT,
ADD COLUMN IF NOT EXISTS video_embed_url TEXT,
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;

-- 4. FINANCE ENHANCEMENT
ALTER TABLE public.finance_bills 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 5. OFFICIAL REPORTS (RAPOT)
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    semester TEXT NOT NULL, -- e.g., 'Ganjil 2024'
    academic_year TEXT NOT NULL, -- e.g., '2024/2025'
    attitude_score TEXT, -- Deskripsi sikap
    extracurriculars JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLASS CHAT ENHANCEMENT
-- We'll use the existing chat_groups but ensure class linking
ALTER TABLE public.chat_groups 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- 7. REALTIME & RLS
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_bills;

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own responses" ON public.quiz_responses FOR ALL USING (auth.uid() = student_id);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TU can manage reports" ON public.report_cards FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tu'));
CREATE POLICY "Anyone linked can view reports" ON public.report_cards FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.report_cards.student_id));
