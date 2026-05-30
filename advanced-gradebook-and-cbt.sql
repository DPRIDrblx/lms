-- Migration for Advanced Gradebook & CBT Enhancements
-- Execute this script in Supabase SQL Editor

-- 1. Create gradebook_columns table
CREATE TABLE IF NOT EXISTS public.gradebook_columns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create gradebook_scores table
CREATE TABLE IF NOT EXISTS public.gradebook_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    column_id UUID NOT NULL REFERENCES public.gradebook_columns(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(column_id, student_id)
);

-- 3. Enable RLS
ALTER TABLE public.gradebook_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_scores ENABLE ROW LEVEL SECURITY;

-- 4. Add basic policies
CREATE POLICY "Enable read access for all users" ON public.gradebook_columns FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON public.gradebook_columns USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for teachers" ON public.gradebook_columns USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'teacher'));

CREATE POLICY "Enable read access for all users" ON public.gradebook_scores FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON public.gradebook_scores USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for teachers" ON public.gradebook_scores USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'teacher'));

-- 5. Trigger for updated_at on gradebook_scores
CREATE OR REPLACE FUNCTION set_gradebook_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_gradebook_scores_updated_at
BEFORE UPDATE ON public.gradebook_scores
FOR EACH ROW
EXECUTE FUNCTION set_gradebook_scores_updated_at();

-- Note: CBT Question Types (complex_mcq, matching) are handled at the application level 
-- as they use JSONB 'options' column in the existing 'questions' table.
