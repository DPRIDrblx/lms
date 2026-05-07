-- SQL RLS Update for TU Master Authority
-- This allows the 'tu' role to manage student and teacher profile assignments.

-- 1. Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing update policy if it conflicts
DROP POLICY IF EXISTS "TU can update all profiles" ON public.profiles;

-- 3. Create the new policy
-- This allows users with the 'tu' role in their own profile to update ANY profile.
CREATE POLICY "TU can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'tu'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'tu'
  )
);

-- 4. Ensure TU can also READ all profiles
DROP POLICY IF EXISTS "TU can read all profiles" ON public.profiles;
CREATE POLICY "TU can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'tu'
  )
  OR auth.uid() = id
);
