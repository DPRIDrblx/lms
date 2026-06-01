-- Migration: NIA Tutoring Platform (Bimbel Eksternal)

-- 1. Add New Roles to profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'tu', 'principal', 'parent', 'sobat_nia', 'pengurus_nia', 'operator_les'));

-- 2. Tutoring Packages
CREATE TABLE IF NOT EXISTS public.nia_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    grade TEXT,
    major TEXT,
    price BIGINT NOT NULL,
    original_price BIGINT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Promo Codes
CREATE TABLE IF NOT EXISTS public.nia_promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percent', 'flat')) DEFAULT 'percent',
    discount_value BIGINT NOT NULL, -- percentage or flat Rupiah amount
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tutoring Subscriptions (Access Control)
CREATE TABLE IF NOT EXISTS public.nia_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.nia_packages(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('active', 'expired', 'pending')) DEFAULT 'active',
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Link Courses to Packages (Many to Many)
CREATE TABLE IF NOT EXISTS public.nia_package_courses (
    package_id UUID REFERENCES public.nia_packages(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, course_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.nia_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nia_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nia_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nia_package_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Packages viewable by everyone" ON public.nia_packages FOR SELECT USING (true);
CREATE POLICY "Operator can manage packages" ON public.nia_packages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operator_les')
);

CREATE POLICY "Promo codes viewable by authenticated users" ON public.nia_promo_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Operator can manage promo codes" ON public.nia_promo_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operator_les')
);

CREATE POLICY "Sobat NIA can view own subscriptions" ON public.nia_subscriptions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Operator and Pengurus can manage subscriptions" ON public.nia_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('operator_les', 'pengurus_nia', 'tu'))
);

CREATE POLICY "Package courses viewable by everyone" ON public.nia_package_courses FOR SELECT USING (true);
CREATE POLICY "Pengurus can manage package courses" ON public.nia_package_courses FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('pengurus_nia', 'operator_les'))
);
