-- PHASE 6: CYBER MAP ARENA (FACTION WARS)

CREATE TABLE IF NOT EXISTS public.faction_war_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    war_id UUID REFERENCES public.faction_wars(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES public.territory_zones(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'lobby', -- lobby, scavenge1, fight1, scavenge2, fight2, ended
    phase_end_time TIMESTAMPTZ,
    challenger_score INT DEFAULT 0,
    defender_score INT DEFAULT 0,
    winner_class_id UUID REFERENCES public.classes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faction_war_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.faction_war_matches(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    team TEXT NOT NULL, -- challenger or defender
    class_id UUID REFERENCES public.classes(id),
    x FLOAT DEFAULT 0,
    y FLOAT DEFAULT 0,
    health INT DEFAULT 100,
    respawns_left INT DEFAULT 2,
    damage_multiplier FLOAT DEFAULT 1.0,
    is_dead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faction_war_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.faction_war_matches(id) ON DELETE CASCADE,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- array of strings
    correct_index INT NOT NULL,
    is_answered BOOLEAN DEFAULT FALSE,
    answered_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.faction_war_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faction_war_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faction_war_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read matches" ON public.faction_war_matches FOR SELECT USING (true);
CREATE POLICY "Public read players" ON public.faction_war_players FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON public.faction_war_questions FOR SELECT USING (true);

-- Allow authenticated users to update their own player state
CREATE POLICY "Players can update own state" ON public.faction_war_players FOR UPDATE 
USING (profile_id = auth.uid());

-- Allow answering questions
CREATE POLICY "Players can update questions" ON public.faction_war_questions FOR UPDATE USING (true);

-- Add helper function to start the match (called by declarer when 5 players selected)
-- We will handle logic in JS for now to be faster, but policies should allow inserting.
CREATE POLICY "Authenticated insert matches" ON public.faction_war_matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert players" ON public.faction_war_players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert questions" ON public.faction_war_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update matches" ON public.faction_war_matches FOR UPDATE USING (auth.role() = 'authenticated');

-- ADD TABLES TO REALTIME
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.profiles, public.faction_wars, public.faction_war_matches, public.faction_war_players, public.faction_war_questions;
COMMIT;
