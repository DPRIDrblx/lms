-- =================================================================================
-- IGNITE EXPANSION: Gamification & Economy Database Schema Update
-- Run this in your Supabase SQL Editor
-- =================================================================================

-- 1. SHOP ITEMS
CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'cosmetic_border', 'cosmetic_effect', 'consumable'
    css_value TEXT, -- e.g. 'ring-4 ring-pink-500', or specific effect class
    icon TEXT, -- Lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Shop Items
INSERT INTO public.shop_items (name, description, price, type, css_value, icon) VALUES
('Streak Freeze', 'Melindungi Streak Api kamu meskipun kamu lupa login selama 1 hari penuh!', 50, 'consumable', 'streak_freeze', 'Snowflake'),
('XP Booster (24h)', 'Meningkatkan perolehan XP dari Quests harian sebesar 2x lipat selama 24 jam.', 150, 'consumable', 'xp_booster', 'Zap'),
('Neon Cyberpunk Border', 'Bingkai neon warna warni bergaya Cyberpunk untuk profil kamu.', 100, 'cosmetic_border', 'ring-4 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.7)]', 'MonitorPlay'),
('Golden VIP Aura', 'Pancaran aura emas yang menyilaukan di sekitar avatarmu.', 300, 'cosmetic_effect', 'ring-4 ring-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-pulse', 'Crown'),
('Ruby Bloodline', 'Bingkai merah darah yang mengintimidasi lawan di Leaderboard.', 120, 'cosmetic_border', 'ring-4 ring-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.8)]', 'Droplets');

-- 2. USER INVENTORY
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT false,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BOUNTY BOARD
CREATE TABLE IF NOT EXISTS public.bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_gems INTEGER NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'taken', 'resolved'
    taken_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LIVE ARENA EXPANSION (Boss Raid Mode)
ALTER TABLE public.live_quiz_sessions
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'classic', -- 'classic' or 'boss_raid'
ADD COLUMN IF NOT EXISTS boss_hp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_boss_hp INTEGER DEFAULT 0;

-- 5. SPECTATOR BETTING
CREATE TABLE IF NOT EXISTS public.live_quiz_spectators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.live_quiz_sessions(id) ON DELETE CASCADE,
    bettor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bet_amount INTEGER NOT NULL,
    odds NUMERIC(5,2) DEFAULT 2.00,
    status TEXT DEFAULT 'pending', -- 'pending', 'won', 'lost'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS & Add Policies (Simplified for prototype)
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop items are viewable by everyone" ON public.shop_items FOR SELECT USING (true);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own inventory" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bounties are viewable by everyone" ON public.bounties FOR SELECT USING (true);
CREATE POLICY "Users can insert their own bounties" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update bounties" ON public.bounties FOR UPDATE USING (true);

ALTER TABLE public.live_quiz_spectators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Spectators can view all bets" ON public.live_quiz_spectators FOR SELECT USING (true);
CREATE POLICY "Users can place bets" ON public.live_quiz_spectators FOR INSERT WITH CHECK (auth.uid() = bettor_id);
