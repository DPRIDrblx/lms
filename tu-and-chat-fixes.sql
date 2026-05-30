-- 1. FIX CHAT GROUPS TYPE CONSTRAINT
ALTER TABLE public.chat_groups DROP CONSTRAINT IF EXISTS chat_groups_type_check;

ALTER TABLE public.chat_groups ADD CONSTRAINT chat_groups_type_check 
CHECK (type IN ('class', 'school', 'parent', 'dm'));

-- 2. CREATE CLASS LEADERSHIP TABLE
CREATE TABLE IF NOT EXISTS public.class_leadership (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    role_title text NOT NULL, -- e.g., 'Ketua', 'Wakil', 'Sekretaris 1', 'Sekretaris 2', 'Pendamping Wali Kelas', 'Pengawas Kelas'
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(class_id, role_title)
);

-- Enable RLS for leadership
ALTER TABLE public.class_leadership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leadership" ON public.class_leadership
    FOR SELECT USING (true);

CREATE POLICY "Admins and Teachers can manage leadership" ON public.class_leadership
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'tu' OR profiles.role = 'teacher' OR profiles.role = 'admin')
        )
    );
