-- Drop the content_type check constraint on the lessons table to allow new content types
-- This allows 'assignment', 'whiteboard', and 'interactive_video' to be saved
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_content_type_check;
