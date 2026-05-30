-- ============================================================
-- Nusantara Academy — Gradebook Constraint Fix
-- ============================================================

-- Drop old constraint if it exists (to avoid confusion)
ALTER TABLE IF EXISTS public.student_scores 
DROP CONSTRAINT IF EXISTS student_scores_student_id_category_id_target_id_key;

-- Add refined unique constraint for the Gradebook Source of Truth
-- This ensures one score per student per assessment target
ALTER TABLE public.student_scores 
ADD CONSTRAINT student_scores_integrity_unique 
UNIQUE (student_id, category_id, target_id);

-- Also ensure assessment categories have a default course link if missing
UPDATE public.assessment_categories 
SET course_id = '00000000-0000-0000-0000-000000000000' 
WHERE course_id IS NULL;
