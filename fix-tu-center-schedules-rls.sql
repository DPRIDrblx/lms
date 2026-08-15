-- Jalankan di SQL Editor Supabase

-- Update RLS Policy untuk center_schedules agar role 'tu' (Tata Usaha) juga bisa menambahkan dan mengedit jadwal
DROP POLICY IF EXISTS "Tutor dan Operator bisa mengedit jadwal" ON public.center_schedules;

CREATE POLICY "Tutor dan Operator bisa mengedit jadwal" 
ON public.center_schedules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('tutor', 'operator_les', 'pengurus_nia', 'admin', 'tu')
  )
);
