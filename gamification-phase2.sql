-- =================================================================================
-- IGNITE EXPANSION: Gamification Phase 2 (Esports & Free Market)
-- Run this in your Supabase SQL Editor
-- =================================================================================

-- 1. HIDEOUT (CLASS BASE)
CREATE TABLE IF NOT EXISTS public.hideout_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    target_gems INTEGER NOT NULL,
    css_value TEXT, 
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.hideout_items (name, description, target_gems, css_value, icon) VALUES
('Sofa Cyberpunk', 'Sofa neon bersinar untuk tempat nongkrong virtual kelasmu.', 2000, 'bg-fuchsia-900/50 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.5)]', 'Sofa'),
('Piala Liga', 'Piala raksasa di tengah ruangan penanda kelas elit.', 5000, 'bg-yellow-900/50 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.7)]', 'Trophy'),
('Bendera Spartan', 'Bendera merah membara yang mengintimidasi pengunjung markas.', 1500, 'bg-rose-900/50 border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.5)]', 'Flag');

CREATE TABLE IF NOT EXISTS public.hideout_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.hideout_items(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hideout_crowdfunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.hideout_items(id) ON DELETE CASCADE,
    current_gems INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DYNAMIC MARKETPLACE
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'sold', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BATTLE ROYALE MODE
ALTER TABLE public.live_quiz_participants ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 3;

-- 4. ACHIEVEMENT SHOWCASE
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    effect_class TEXT, -- 'confetti', 'stars', 'fire'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.badges (name, description, icon, effect_class) VALUES
('Top 1 Global', 'Pemain nomor 1 di Leaderboard IGNITE.', 'Trophy', 'stars'),
('Master of Math', 'Menyelesaikan 100 soal Matematika.', 'Calculator', 'confetti'),
('Mercenary King', 'Menyelesaikan 50 Bounty.', 'Crosshair', 'fire');

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS showcase_badges JSONB DEFAULT '[]'::jsonb;

-- 5. THE GOLDEN HOUR (DAILY MYSTERY QUIZ)
CREATE TABLE IF NOT EXISTS public.golden_hour_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    attempt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_completed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. GLOBAL SETTINGS
CREATE TABLE IF NOT EXISTS public.global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

INSERT INTO public.global_settings (key, value) VALUES ('golden_hour_active', 'false'::jsonb) ON CONFLICT DO NOTHING;

-- Basic RLS for the new tables
ALTER TABLE public.hideout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public hideout items" ON public.hideout_items FOR SELECT USING (true);

ALTER TABLE public.hideout_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public hideout inventory" ON public.hideout_inventory FOR SELECT USING (true);

ALTER TABLE public.hideout_crowdfunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public hideout crowdfunds" ON public.hideout_crowdfunds FOR ALL USING (true);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public marketplace" ON public.marketplace_listings FOR ALL USING (true);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public badges" ON public.badges FOR SELECT USING (true);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public user badges" ON public.user_badges FOR SELECT USING (true);

ALTER TABLE public.golden_hour_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their attempts" ON public.golden_hour_attempts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public settings" ON public.global_settings FOR ALL USING (true);
