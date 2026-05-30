-- ============================================================
-- Nusantara Academy — Comprehensive Operational Overhaul
-- ============================================================

-- 1. FORCE PASSWORD RESET
-- Add flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- 2. CLASS LEADERSHIP & MANAGEMENT
-- Add structure for class president, vice president, secretaries, and supervising teachers
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS co_homeroom_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS president_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS vice_president_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS secretary_1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS secretary_2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. SEED CHAT GROUPS FOR EXISTING CLASSES
-- Create a general channel for every existing class that doesn't have one
DO $$
DECLARE
    class_rec RECORD;
BEGIN
    FOR class_rec IN SELECT id, name FROM public.classes LOOP
        IF NOT EXISTS (SELECT 1 FROM public.chat_groups WHERE class_id = class_rec.id AND type = 'class') THEN
            INSERT INTO public.chat_groups (name, type, class_id)
            VALUES (class_rec.name || ' General', 'class', class_rec.id);
        END IF;
    END LOOP;
END $$;
