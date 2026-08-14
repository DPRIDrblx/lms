ALTER TABLE public.nia_promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes viewable by authenticated users" ON public.nia_promo_codes;
CREATE POLICY "Promo codes viewable by everyone" ON public.nia_promo_codes FOR SELECT USING (true);
