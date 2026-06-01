-- Drop the role check constraint to allow new roles (tu, principal, parent)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Update the handle_new_user trigger to set principal status to pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  extracted_role text;
  assigned_status text;
BEGIN
  extracted_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  
  -- If principal, set to pending. Otherwise, approved.
  IF extracted_role = 'principal' THEN
    assigned_status := 'pending';
  ELSE
    assigned_status := 'approved';
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, status)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    extracted_role,
    assigned_status
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
