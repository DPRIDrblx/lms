-- ==========================================
-- SOCIAL NETWORK, DMs, & WEEKLY DRILLS MIGRATION
-- ==========================================

-- 1. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view friendships" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON public.friendships FOR ALL USING (auth.uid() = follower_id);

-- 2. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- 3. DIRECT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own DMs" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send DMs" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update read status" ON public.direct_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 4. WEEKLY DRILLS TABLE (For Homeroom Teachers)
CREATE TABLE IF NOT EXISTS public.drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    xp_reward INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view drills" ON public.drills FOR SELECT USING (true);
CREATE POLICY "Teachers can manage drills" ON public.drills FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'teacher' OR role = 'principal' OR role = 'tu')
    )
);

-- 5. DRILL QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.drill_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drill_id UUID REFERENCES public.drills(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drill_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view drill questions" ON public.drill_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage drill questions" ON public.drill_questions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'teacher' OR role = 'principal' OR role = 'tu')
    )
);

-- 6. DRILL SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.drill_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drill_id UUID REFERENCES public.drills(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(drill_id, student_id)
);

ALTER TABLE public.drill_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their submissions" ON public.drill_submissions FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'student'));
CREATE POLICY "Students can insert submissions" ON public.drill_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update submissions" ON public.drill_submissions FOR UPDATE USING (auth.uid() = student_id);

-- 7. STORAGE BUCKET FOR POSTS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social_media', 'social_media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view social_media" ON storage.objects FOR SELECT USING (bucket_id = 'social_media');
CREATE POLICY "Authenticated users can upload social_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social_media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own social_media" ON storage.objects FOR DELETE USING (bucket_id = 'social_media' AND auth.uid() = owner);
