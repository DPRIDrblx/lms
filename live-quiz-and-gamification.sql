-- ============================================================
-- Nusantara International Academy — Live Quiz & Gamification Update
-- ============================================================

-- 1. Add Gamification columns to PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS daily_quests JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_quest_reset DATE;

-- 2. Create LIVE QUIZ tables
CREATE TABLE IF NOT EXISTS public.live_quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    pin_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('waiting', 'active', 'finished')) DEFAULT 'waiting',
    current_question_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_quiz_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.live_quiz_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb, -- to store fast answers
    avatar_seed TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 3. Enable RLS
ALTER TABLE public.live_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_participants ENABLE ROW LEVEL SECURITY;

-- 4. Set Policies for Live Quiz Sessions
CREATE POLICY "Anyone can view live quiz sessions by pin"
    ON public.live_quiz_sessions FOR SELECT 
    USING (true);

CREATE POLICY "Teachers can manage own live quiz sessions"
    ON public.live_quiz_sessions FOR ALL
    USING (teacher_id = auth.uid());

-- 5. Set Policies for Live Quiz Participants
CREATE POLICY "Participants can view other participants in the same session"
    ON public.live_quiz_participants FOR SELECT 
    USING (true);

CREATE POLICY "Students can join and update their own participant record"
    ON public.live_quiz_participants FOR ALL
    USING (student_id = auth.uid());

-- 6. Enable Realtime
BEGIN;
  -- Remove existing if we want to cleanly recreate, or just add
  -- alter publication supabase_realtime add table public.live_quiz_sessions;
  -- alter publication supabase_realtime add table public.live_quiz_participants;
  -- Let's just create a new publication or alter the existing one safely
COMMIT;

-- Safely add to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quiz_participants;

-- 7. Trigger to update updated_at on live_quiz_sessions (optional but good for realtime filtering)
CREATE OR REPLACE FUNCTION update_live_quiz_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS live_quiz_updated_at ON public.live_quiz_sessions;
CREATE TRIGGER live_quiz_updated_at
BEFORE UPDATE ON public.live_quiz_sessions
FOR EACH ROW EXECUTE PROCEDURE update_live_quiz_updated_at();

-- IMPORTANT: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
