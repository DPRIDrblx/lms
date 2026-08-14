DROP POLICY IF EXISTS "Operators can read all profiles" ON public.profiles;

CREATE POLICY "Operators can read all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('operator_les', 'admin', 'pengurus')
        )
    );
