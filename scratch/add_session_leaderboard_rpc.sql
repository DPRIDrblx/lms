-- Buat fungsi (RPC) untuk mengambil data leaderboard bintang per sesi (jadwal_les)
-- SECURITY DEFINER digunakan agar fungsi ini bisa berjalan mengabaikan RLS,
-- sehingga siswa tetap bisa melihat total bintang siswa lainnya dalam satu sesi.
CREATE OR REPLACE FUNCTION get_session_stars_leaderboard(p_schedule_id UUID)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  stars BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.student_id,
    p.full_name,
    s.stars::BIGINT
  FROM 
    public.student_stars s
  JOIN 
    public.profiles p ON s.student_id = p.id
  WHERE 
    s.schedule_id = p_schedule_id
  ORDER BY 
    s.stars DESC;
END;
$$;
