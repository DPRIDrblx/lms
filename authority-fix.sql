-- ============================================================
-- Nusantara Academy — Authority & Integrity Fix
-- ============================================================

-- 1. HOME ROOM AUTHORITY FIX
-- Ensure Ray-Guru is assigned to 7B (assuming name '7B' exists)
DO $$
DECLARE
    teacher_id UUID;
BEGIN
    SELECT id INTO teacher_id FROM public.profiles WHERE full_name = 'Ray-Guru' LIMIT 1;
    IF teacher_id IS NOT NULL THEN
        UPDATE public.classes SET homeroom_teacher_id = teacher_id WHERE name = '7B';
    END IF;
END $$;

-- 2. UNIFIED WALLET ARCHITECTURE
-- Force shared wallet ID for parents and students
CREATE OR REPLACE FUNCTION public.get_shared_wallet_id(target_student_id UUID)
RETURNS UUID AS $$
    SELECT id FROM public.wallets WHERE student_id = target_student_id;
$$ LANGUAGE sql STABLE;

-- 3. CHAT DIRECTORY VIEW
-- A view to simplify directory fetching per user's class
CREATE OR REPLACE VIEW public.class_directory AS
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.class_id,
    c.name as class_name
FROM public.profiles p
JOIN public.classes c ON p.class_id = c.id;

-- 4. ENSURE CBT PERSISTENCE SCHEMA
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    time_left_seconds INTEGER NOT NULL,
    current_question_id UUID,
    status TEXT DEFAULT 'ongoing',
    metadata JSONB DEFAULT '{"flags": {}}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, quiz_id)
);

-- 5. REALTIME ENABLEMENT
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_sessions;
