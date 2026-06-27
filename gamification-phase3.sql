-- =================================================================================
-- IGNITE EXPANSION: Gamification Phase 3 (The Grand Arena: War of Factions)
-- Run this in your Supabase SQL Editor
-- =================================================================================

-- 1. TERRITORY ZONES
CREATE TABLE IF NOT EXISTS public.territory_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    buff_description TEXT,
    controlling_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Territories
INSERT INTO public.territory_zones (name, description, buff_description, color, icon) VALUES
('Zona Lab Komputer', 'Pusat komputasi kuantum dengan kecepatan internet super.', '+10% XP untuk Quest Teknologi', 'cyan', 'Laptop2'),
('Perpustakaan Cyber', 'Arsip data masa lalu dan masa depan.', 'Diskon 10% di IGNITE Shop', 'amber', 'Library'),
('Kantin Virtual', 'Area pemulihan energi dan tempat nongkrong.', '+1 HP Tambahan di Battle Royale', 'rose', 'Coffee'),
('Stadion Esports', 'Arena tempat para gladiator digital bertarung.', 'Reward Bounty Naik 20%', 'emerald', 'Swords');


-- 2. FACTION WARS
CREATE TABLE IF NOT EXISTS public.faction_wars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES public.territory_zones(id) ON DELETE CASCADE,
    challenger_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    defender_class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL, -- Chosen by teacher later
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'finished'
    challenger_ap INTEGER DEFAULT 0,
    defender_ap INTEGER DEFAULT 0,
    declaration_fee INTEGER DEFAULT 0,
    declared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LIVE QUIZ SESSIONS UPDATE
ALTER TABLE public.live_quiz_sessions
ADD COLUMN IF NOT EXISTS faction_war_id UUID REFERENCES public.faction_wars(id) ON DELETE SET NULL;


-- RLS Policies
ALTER TABLE public.territory_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public territory zones" ON public.territory_zones FOR SELECT USING (true);
CREATE POLICY "TU can manage zones" ON public.territory_zones FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu')
);

ALTER TABLE public.faction_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public faction wars" ON public.faction_wars FOR SELECT USING (true);
CREATE POLICY "Students can declare war" ON public.faction_wars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);
CREATE POLICY "Teachers can update war status" ON public.faction_wars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu', 'principal'))
);
