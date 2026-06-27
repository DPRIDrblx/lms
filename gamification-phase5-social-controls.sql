-- =================================================================================
-- IGNITE EXPANSION: Gamification Phase 5 (Parental Social Controls)
-- Run this in your Supabase SQL Editor
-- =================================================================================

-- 1. PROFILE UPDATES FOR SOCIAL CONTROLS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_access_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS social_visibility TEXT DEFAULT 'public'; -- 'public', 'friends_only', 'private'

-- 2. STUDENT BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.student_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, blocked_user_id)
);

-- Enable RLS for student_blocks
ALTER TABLE public.student_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their blocks" ON public.student_blocks;
CREATE POLICY "Users can view their blocks" 
ON public.student_blocks FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Parents can manage their childs blocks" ON public.student_blocks;
CREATE POLICY "Parents can manage their childs blocks" 
ON public.student_blocks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl 
    WHERE psl.parent_id = auth.uid() AND psl.student_id = student_blocks.student_id
  )
);

-- To allow parents to delete posts and friendships of their kids, we need policies on those tables too.
-- Let's update `posts` and `friendships` RLS to allow parents to delete.

DROP POLICY IF EXISTS "Parents can delete childs posts" ON public.posts;
CREATE POLICY "Parents can delete childs posts" 
ON public.posts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl 
    WHERE psl.parent_id = auth.uid() AND psl.student_id = posts.user_id
  )
);

DROP POLICY IF EXISTS "Parents can delete childs follows" ON public.friendships;
CREATE POLICY "Parents can delete childs follows" 
ON public.friendships FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl 
    WHERE psl.parent_id = auth.uid() AND (psl.student_id = friendships.follower_id OR psl.student_id = friendships.following_id)
  )
);

-- Allow parents to update childs profile for social settings
DROP POLICY IF EXISTS "Parents can update childs social settings" ON public.profiles;
CREATE POLICY "Parents can update childs social settings" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM parent_student_links psl 
    WHERE psl.parent_id = auth.uid() AND psl.student_id = profiles.id
  )
);
