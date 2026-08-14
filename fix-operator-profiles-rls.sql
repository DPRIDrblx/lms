DROP POLICY IF EXISTS "Operators can read all profiles" ON public.profiles;

-- Create policy to read all profiles for operators
CREATE POLICY "Operators can read all profiles"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id -- Base case to prevent infinite recursion
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('operator_les', 'admin', 'pengurus')
        )
    );
