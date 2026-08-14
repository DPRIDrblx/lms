-- Jalankan di SQL Editor Supabase

-- Berikan izin agar Operator Les dan Pengurus bisa membaca semua jadwal kelas
ALTER TABLE public.center_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa melihat jadwal" ON public.center_schedules;
CREATE POLICY "Semua orang bisa melihat jadwal" 
ON public.center_schedules FOR SELECT 
USING (true);

-- Berikan izin agar Operator Les dan Tutor bisa menyimpan/mengubah jadwal kelas
DROP POLICY IF EXISTS "Tutor dan Operator bisa mengedit jadwal" ON public.center_schedules;
CREATE POLICY "Tutor dan Operator bisa mengedit jadwal" 
ON public.center_schedules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('tutor', 'operator_les', 'pengurus_nia', 'admin')
  )
);

-- Pastikan absensi juga bisa dilihat oleh operator
ALTER TABLE public.center_schedule_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua orang bisa membaca absensi" ON public.center_schedule_attendances;
CREATE POLICY "Semua orang bisa membaca absensi" 
ON public.center_schedule_attendances FOR SELECT 
USING (true);
