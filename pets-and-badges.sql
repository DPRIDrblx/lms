-- =================================================================================
-- IGNITE EXPANSION: Digital Pet & Badges System
-- =================================================================================

-- 1. Add active_title column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_title TEXT;

-- 2. Create student_pets table
CREATE TABLE IF NOT EXISTS public.student_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL DEFAULT 'Telur Misterius',
    stage INTEGER DEFAULT 1, -- 1: Egg, 2: Baby, 3: Adult
    health INTEGER DEFAULT 100, -- 0-100 (Hunger)
    last_fed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create student_badges table (Trophy Room)
CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL, -- e.g., 'first_blood', 'rich_kid', 'speed_demon'
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- Note: In a real system we would create a cron job or trigger to reduce health daily, 
-- but for UI demonstration, we handle logic in the client/API side.
