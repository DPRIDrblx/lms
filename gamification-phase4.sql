-- =================================================================================
-- IGNITE EXPANSION: Gamification Phase 4 (Parent Engagement & Control)
-- Run this in your Supabase SQL Editor
-- =================================================================================

-- 1. CANTEEN POCKET MONEY LIMITER
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 50000;

-- 2. PARENT QUESTS
CREATE TABLE IF NOT EXISTS public.parent_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_gems INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for parent_quests
ALTER TABLE public.parent_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their own created quests" 
ON public.parent_quests FOR ALL 
USING (auth.uid() = parent_id);

CREATE POLICY "Students can view and update their own quests" 
ON public.parent_quests FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their quests to completed" 
ON public.parent_quests FOR UPDATE 
USING (auth.uid() = student_id);
