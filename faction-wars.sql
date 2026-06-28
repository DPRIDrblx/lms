-- =================================================================================
-- IGNITE EXPANSION: Faction Wars & Class Dojo
-- =================================================================================

-- 1. Add faction column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faction TEXT;

-- 2. Create RPC for Faction Leaderboard
CREATE OR REPLACE FUNCTION get_faction_leaderboard()
RETURNS TABLE (
    faction_name TEXT,
    total_xp BIGINT,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        faction AS faction_name,
        COALESCE(SUM(xp), 0)::BIGINT AS total_xp,
        COUNT(id)::BIGINT AS member_count
    FROM public.profiles
    WHERE role = 'student' AND faction IS NOT NULL
    GROUP BY faction
    ORDER BY total_xp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC for Top Faction Members
CREATE OR REPLACE FUNCTION get_top_faction_members(p_faction TEXT, p_limit INT DEFAULT 3)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    xp BIGINT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        COALESCE(p.xp, 0)::BIGINT as xp,
        p.avatar_url
    FROM public.profiles p
    WHERE p.role = 'student' AND p.faction = p_faction
    ORDER BY p.xp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
