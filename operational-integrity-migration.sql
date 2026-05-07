-- ============================================================
-- Nusantara International Academy — Operational Integrity & Anti-Pajangan Patch
-- ============================================================

-- 1. TU: SMART CARD LINKING ENHANCEMENT
-- Allow linking cards to both student and parent for synchronized tap notifications
ALTER TABLE public.card_inventory 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. TEACHER: MULTI-ASSESSMENT GRADING SYSTEM
-- Create assessment categories for dynamic gradebook columns
CREATE TABLE IF NOT EXISTS public.assessment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., 'Tugas 1', 'Kuis', 'UTS'
    weight INTEGER DEFAULT 0, -- optional for final grade calculation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update student_scores to link with categories
ALTER TABLE public.student_scores 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.assessment_categories(id) ON DELETE CASCADE;

-- 3. COURSE: CLASS BINDING
-- Ensure courses are assigned to specific classes
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- 4. RLS UPDATES FOR TU
ALTER TABLE public.card_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "TU can manage all cards" ON public.card_inventory;
CREATE POLICY "TU can manage all cards" 
ON public.card_inventory FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'tu'));

-- 5. RLS UPDATES FOR TEACHER GRADING
ALTER TABLE public.assessment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage assessment categories" 
ON public.assessment_categories FOR ALL 
USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()));

CREATE POLICY "Authenticated can view categories" 
ON public.assessment_categories FOR SELECT 
USING (auth.role() = 'authenticated');

-- 6. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.card_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
