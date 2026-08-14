CREATE TABLE IF NOT EXISTS public.nia_branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    province TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nia_branches ENABLE ROW LEVEL SECURITY;

-- Policies for nia_branches
CREATE POLICY "Public read access for active branches" ON public.nia_branches
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Full access for super_admin" ON public.nia_branches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Full access for operator_les" ON public.nia_branches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'operator_les'
        )
    );

-- Insert dummy data based on user screenshots
INSERT INTO public.nia_branches (name, address, city, province)
VALUES 
('Ambon - Said Perintah', 'Jl. Said Perintah No. 46 RT 002/RW 003 Kel. Honipopu', 'Kota Ambon', 'Maluku'),
('Atambua - Proklamasi', 'Jl. Proklamasi 015/005 Bardao, Atambua Barat', 'Atambua/Belu', 'NTT'),
('Badung - Kapal', 'Jl. Raya Kapal No.38. Kapal. Mengwi.', 'Badung', 'Bali');
