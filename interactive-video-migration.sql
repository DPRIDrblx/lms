-- Migration: Add Interactive Video Quiz Data to Lessons Table

-- 1. Add interactive_quiz_data JSONB column to lessons
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS interactive_quiz_data JSONB DEFAULT '[]'::jsonb;

-- 2. Add description comment for documentation
COMMENT ON COLUMN public.lessons.interactive_quiz_data IS 'Stores an array of quiz objects {timestamp, question, options, correct_index} for interactive_video content_type.';
