-- Drop the old constraint
ALTER TABLE public.student_scores DROP CONSTRAINT IF EXISTS student_scores_target_type_check;

-- Add the new constraint including 'course'
ALTER TABLE public.student_scores ADD CONSTRAINT student_scores_target_type_check 
CHECK (target_type IN ('quiz', 'assignment', 'manual', 'offline', 'course'));
