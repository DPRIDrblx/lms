-- ==========================================
-- 1. POLICIES UNTUK STUDENT_SCORES
-- ==========================================
ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their own scores" ON public.student_scores;
CREATE POLICY "Students can insert their own scores" 
ON public.student_scores FOR INSERT 
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can view their own scores" ON public.student_scores;
CREATE POLICY "Students can view their own scores" 
ON public.student_scores FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view student scores" ON public.student_scores;
CREATE POLICY "Teachers can view student scores" 
ON public.student_scores FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
);

DROP POLICY IF EXISTS "Teachers can update student scores" ON public.student_scores;
CREATE POLICY "Teachers can update student scores" 
ON public.student_scores FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
);


-- ==========================================
-- 2. POLICIES UNTUK QUIZ_RESPONSES
-- ==========================================
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert/update their own responses" ON public.quiz_responses;
CREATE POLICY "Students can insert/update their own responses" 
ON public.quiz_responses FOR ALL 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view student responses" ON public.quiz_responses;
CREATE POLICY "Teachers can view student responses" 
ON public.quiz_responses FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
);


-- ==========================================
-- 3. POLICIES UNTUK EXAM_SESSIONS
-- ==========================================
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage their own sessions" ON public.exam_sessions;
CREATE POLICY "Students can manage their own sessions" 
ON public.exam_sessions FOR ALL 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view sessions" ON public.exam_sessions;
CREATE POLICY "Teachers can view sessions" 
ON public.exam_sessions FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
);
