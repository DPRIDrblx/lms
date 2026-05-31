-- ============================================================
-- Nusantara International Academy — Gamification Migration
-- ============================================================

-- Drop the old constraint
ALTER TABLE public.lessons 
DROP CONSTRAINT IF EXISTS lessons_content_type_check;

-- Re-add the constraint including 'game'
ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_content_type_check 
CHECK (content_type in ('text', 'video', 'pdf', 'game'));
