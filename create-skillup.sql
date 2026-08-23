-- 1. Add skill_coins column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_coins INTEGER DEFAULT 0;

-- 2. Create Skill Up Missions (The categories/modules)
CREATE TABLE IF NOT EXISTS public.skillup_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_level VARCHAR(50), -- e.g. "Kelas 10 SMA/K" or "All"
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Skill Up Tasks (The individual tasks under a mission)
CREATE TABLE IF NOT EXISTS public.skillup_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES public.skillup_missions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward_coins INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Skill Up Progress (Tracks student completion of tasks)
CREATE TABLE IF NOT EXISTS public.skillup_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.skillup_tasks(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, task_id)
);

-- Enable RLS
ALTER TABLE public.skillup_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skillup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skillup_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view missions" ON public.skillup_missions FOR SELECT USING (true);
CREATE POLICY "Anyone can view tasks" ON public.skillup_tasks FOR SELECT USING (true);

CREATE POLICY "Students can view their own progress" ON public.skillup_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert their own progress" ON public.skillup_progress FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own progress" ON public.skillup_progress FOR UPDATE USING (auth.uid() = student_id);
