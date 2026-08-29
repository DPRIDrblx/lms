-- 1. Tambahkan kolom shared_notes untuk fitur Catatan Kolaboratif
ALTER TABLE public.center_schedules
ADD COLUMN IF NOT EXISTS shared_notes TEXT;

-- 2. Buat fungsi (RPC) untuk mengambil data leaderboard bintang bulanan
-- SECURITY DEFINER digunakan agar fungsi ini bisa berjalan mengabaikan RLS,
-- sehingga siswa tetap bisa melihat total bintang siswa lainnya.
CREATE OR REPLACE FUNCTION get_monthly_stars_leaderboard()
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  total_stars BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_day_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Ambil tanggal 1 bulan ini
  first_day_of_month := date_trunc('month', now());
  
  RETURN QUERY
  SELECT 
    s.student_id,
    p.full_name,
    SUM(s.stars)::BIGINT as total_stars
  FROM 
    public.student_stars s
  JOIN 
    public.profiles p ON s.student_id = p.id
  WHERE 
    s.created_at >= first_day_of_month
  GROUP BY 
    s.student_id, p.full_name
  ORDER BY 
    total_stars DESC
  LIMIT 10;
END;
$$;
