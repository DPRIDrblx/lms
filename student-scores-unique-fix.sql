-- Remove existing duplicate rows (keep the latest one) just in case
DELETE FROM public.student_scores
WHERE id NOT IN (
    SELECT MAX(id)
    FROM public.student_scores
    GROUP BY student_id, target_id
);

-- Add the unique constraint so that upsert works
ALTER TABLE public.student_scores DROP CONSTRAINT IF EXISTS student_scores_student_id_target_id_key;
ALTER TABLE public.student_scores ADD CONSTRAINT student_scores_student_id_target_id_key UNIQUE(student_id, target_id);
