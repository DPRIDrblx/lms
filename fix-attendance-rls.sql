ALTER TABLE public.center_schedule_attendances ENABLE ROW LEVEL SECURITY;

-- Allow students to insert their own attendance
DROP POLICY IF EXISTS "Siswa bisa mengisi absensi sendiri" ON public.center_schedule_attendances;
CREATE POLICY "Siswa bisa mengisi absensi sendiri"
ON public.center_schedule_attendances FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow students to update their own attendance (for rating)
DROP POLICY IF EXISTS "Siswa bisa update absensi sendiri" ON public.center_schedule_attendances;
CREATE POLICY "Siswa bisa update absensi sendiri"
ON public.center_schedule_attendances FOR UPDATE
USING (auth.uid() = student_id);

-- Allow operator, admin, tutor to manage attendances
DROP POLICY IF EXISTS "Tutor dan Operator bisa mengelola absensi" ON public.center_schedule_attendances;
CREATE POLICY "Tutor dan Operator bisa mengelola absensi"
ON public.center_schedule_attendances FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('tutor', 'operator_les', 'pengurus_nia', 'admin')
  )
);
