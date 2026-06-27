INSERT INTO public.territory_zones (name, description, buff_description) VALUES
('Zona Lab Komputer', 'Pusat teknologi sekolah dengan fasilitas kelas wahid.', '+15% XP dari semua Misi Harian'),
('Perpustakaan Cyber', 'Gudang ilmu tak terbatas yang menyimpan literatur digital kuno.', '+10% Drop Rate Gems saat Quest'),
('Kantin Sentral', 'Area netral tempat faksi-faksi beristirahat dan memulihkan energi.', 'Diskon 5% untuk semua item di Market'),
('Taman Rahasia', 'Wilayah tenang yang tersembunyi dari hiruk-pikuk akademik.', 'Regenerasi energi lebih cepat saat mengerjakan Quiz');



-- FIX RLS INFINITE RECURSION FOR TU
DROP POLICY IF EXISTS "TU can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "TU can update all profiles" ON public.profiles;

-- REPLACE WITH SECURITY DEFINER FUNCTION OR JUST RELY ON PUBLIC POLICY
CREATE OR REPLACE FUNCTION public.check_is_tu_or_principal()
RETURNS BOOLEAN AS $func$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('tu', 'principal')
  );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "TU can update all profiles fixed" 
ON public.profiles FOR UPDATE 
USING (public.check_is_tu_or_principal());

