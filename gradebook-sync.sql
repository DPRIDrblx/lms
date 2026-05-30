-- 1. ADD linked_quiz_id TO gradebook_columns
ALTER TABLE public.gradebook_columns ADD COLUMN IF NOT EXISTS linked_quiz_id uuid REFERENCES public.quizzes(id) ON DELETE SET NULL;
