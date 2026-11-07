-- ============================================================
-- CBT MMIS v2 Migration Schema
-- Enhances quizzes & questions for CBT MMIS v2 Platform
-- ============================================================

-- 1. QUIZZES TABLE ENHANCEMENTS FOR CBT MMIS v2
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS is_cbt_v2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_classes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS token_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS token_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS require_webcam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_rules TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS statement_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS points_correct NUMERIC DEFAULT 4,
ADD COLUMN IF NOT EXISTS penalty_wrong NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS cbt_config JSONB DEFAULT '{}'::jsonb;

-- 2. QUESTIONS TABLE ENHANCEMENTS FOR CBT MMIS v2
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS points_correct NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS penalty_wrong NUMERIC DEFAULT NULL;

-- 3. ENSURE RLS POLICIES FOR CBT SESSIONS
CREATE TABLE IF NOT EXISTS public.cbt_tab_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    violation_count INTEGER NOT NULL DEFAULT 1,
    violation_type TEXT DEFAULT 'tab_exit',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cbt_tab_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their own violations" ON public.cbt_tab_violations;
CREATE POLICY "Students can insert their own violations"
    ON public.cbt_tab_violations FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view all violations" ON public.cbt_tab_violations;
CREATE POLICY "Teachers can view all violations"
    ON public.cbt_tab_violations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu', 'principal')));
