-- Drop the old constraint
ALTER TABLE public.student_scores DROP CONSTRAINT IF EXISTS student_scores_target_type_check;

-- Add the new constraint including 'course'
ALTER TABLE public.student_scores ADD CONSTRAINT student_scores_target_type_check 
CHECK (target_type IN ('quiz', 'assignment', 'manual', 'offline', 'course'));

-- Add missing INSERT policy for teachers
DROP POLICY IF EXISTS "Teachers can insert student scores" ON public.student_scores;
CREATE POLICY "Teachers can insert student scores" 
ON public.student_scores FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
);
