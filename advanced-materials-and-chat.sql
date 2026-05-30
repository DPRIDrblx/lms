-- 1. FIX CBT QUESTION CONSTRAINT
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('mcq', 'essay', 'complex_mcq', 'matching'));

-- 2. ENHANCE LESSONS TABLE FOR PDF/VIDEO
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS xp_reward integer DEFAULT 10;

-- 3. CREATE LESSON PROGRESS TABLE FOR XP TRACKING
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at timestamp with time zone DEFAULT now(),
    xp_awarded integer DEFAULT 0,
    UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.lesson_progress
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own progress" ON public.lesson_progress
    FOR INSERT WITH CHECK (auth.uid() = student_id);
