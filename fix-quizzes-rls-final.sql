-- Fix RLS for quizzes and questions to ensure Teachers and TU can manage them

-- QUIZZES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teacher can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teacher can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teacher can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Teachers can delete quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "TU can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "TU and Principal can manage quizzes" ON public.quizzes;

CREATE POLICY "Authenticated users can view quizzes" 
  ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can insert quizzes" 
  ON public.quizzes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can update quizzes" 
  ON public.quizzes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = quizzes.course_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can delete quizzes" 
  ON public.quizzes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = quizzes.course_id AND teacher_id = auth.uid())
  );

CREATE POLICY "TU and Principal can manage quizzes"
  ON public.quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal'))
  );

-- QUESTIONS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;
DROP POLICY IF EXISTS "Teacher can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Teacher can update questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can update questions" ON public.questions;
DROP POLICY IF EXISTS "Teacher can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can delete questions" ON public.questions;
DROP POLICY IF EXISTS "TU and Principal can manage questions" ON public.questions;

CREATE POLICY "Authenticated users can view questions" 
  ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can insert questions" 
  ON public.questions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      JOIN public.courses ON quizzes.course_id = courses.id 
      WHERE quizzes.id = quiz_id AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update questions" 
  ON public.questions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      JOIN public.courses ON quizzes.course_id = courses.id 
      WHERE quizzes.id = questions.quiz_id AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete questions" 
  ON public.questions FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      JOIN public.courses ON quizzes.course_id = courses.id 
      WHERE quizzes.id = questions.quiz_id AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "TU and Principal can manage questions"
  ON public.questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal'))
  );
