-- Peningkatan Fitur Guru Piket & Jurnal KBM (Presensi Siswa)

-- 1. Create table for Guru Piket Schedules
CREATE TABLE IF NOT EXISTS public.ace_piket_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, day_of_week)
);

-- Enable RLS for ace_piket_schedules
ALTER TABLE public.ace_piket_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for ace_piket_schedules
DROP POLICY IF EXISTS "Public can view piket schedules" ON public.ace_piket_schedules;
CREATE POLICY "Public can view piket schedules" ON public.ace_piket_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "TU can manage piket schedules" ON public.ace_piket_schedules;
CREATE POLICY "TU can manage piket schedules" ON public.ace_piket_schedules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tu'));

-- 2. Modify ace_logbooks to store detailed student presences
ALTER TABLE public.ace_logbooks ADD COLUMN IF NOT EXISTS student_presences JSONB DEFAULT '[]'::jsonb;
