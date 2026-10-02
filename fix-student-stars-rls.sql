ALTER TABLE public.student_stars ENABLE ROW LEVEL SECURITY;

-- Allow students to read stars
DROP POLICY IF EXISTS "Siswa bisa melihat bintang" ON public.student_stars;
CREATE POLICY "Siswa bisa melihat bintang"
ON public.student_stars FOR SELECT
USING (true);

-- Allow students to insert stars
DROP POLICY IF EXISTS "Siswa bisa menambah bintang CBT" ON public.student_stars;
CREATE POLICY "Siswa bisa menambah bintang CBT"
ON public.student_stars FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow students to update stars
DROP POLICY IF EXISTS "Siswa bisa update bintang CBT" ON public.student_stars;
CREATE POLICY "Siswa bisa update bintang CBT"
ON public.student_stars FOR UPDATE
USING (auth.uid() = student_id);
