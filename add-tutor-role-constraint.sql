-- Add 'tutor' to profiles_role_check
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'tu', 'principal', 'parent', 'sobat_nia', 'pengurus_nia', 'operator_les', 'tutor'));
