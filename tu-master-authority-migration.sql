-- TU Master Authority & Class Integration
-- This script enables Class-based management, Gradebook editing, and Real-time sync capabilities.

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    wali_kelas_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Profiles with Class Assignment
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- 3. Update Courses with Class Target
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- 4. Update Attendance Sessions to link to Course
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

-- 5. RLS Policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on classes" ON public.classes FOR ALL USING (true);

-- 6. Seed initial classes (optional but helpful for TU)
INSERT INTO public.classes (name) VALUES 
('7A'), ('7B'), ('7C'), ('7D'), ('7E'),
('8A'), ('8B'), ('8C'), ('8D'), ('8E'),
('9A'), ('9B'), ('9C'), ('9D'), ('9E')
ON CONFLICT (name) DO NOTHING;

-- 7. Ensure TU Role is allowed in profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'parent', 'tu'));

-- Real-time setup (Note: Run this in Supabase Dashboard for Publication if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs, student_scores, wallets, chat_messages, lesson_feedback;
