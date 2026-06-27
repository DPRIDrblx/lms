CREATE TABLE IF NOT EXISTS public.territory_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    controlling_class_id UUID REFERENCES public.classes(id),
    buff_description TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faction_wars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES public.territory_zones(id) ON DELETE CASCADE,
    challenger_class_id UUID REFERENCES public.classes(id),
    defender_class_id UUID REFERENCES public.classes(id),
    status TEXT DEFAULT 'pending', 
    winner_class_id UUID REFERENCES public.classes(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hapus dulu jika sudah ada (agar tidak duplicate saat di-run ulang)
TRUNCATE TABLE public.territory_zones CASCADE;

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

DROP POLICY IF EXISTS "TU can update all profiles fixed" ON public.profiles;
CREATE POLICY "TU can update all profiles fixed" 
ON public.profiles FOR UPDATE 
USING (public.check_is_tu_or_principal());

DROP POLICY IF EXISTS "TU can read all profiles fixed" ON public.profiles;
CREATE POLICY "TU can read all profiles fixed" 
ON public.profiles FOR SELECT 
USING (public.check_is_tu_or_principal());
