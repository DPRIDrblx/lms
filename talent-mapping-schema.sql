-- Create sequence for talent mapping tables if needed or just use UUIDs.
-- Assuming student_id matches auth.users.id or your student profile id type.

CREATE TABLE IF NOT EXISTS public.tm_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mbti_result VARCHAR(10),
    riasec_result VARCHAR(10),
    ptn_target VARCHAR(255),
    major_target VARCHAR(255),
    mbti_details JSONB,
    riasec_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id)
);

CREATE TABLE IF NOT EXISTS public.tm_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL, -- 'mbti' or 'minat-bakat'
    progress_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, assessment_type)
);

-- RLS for tm_results
ALTER TABLE public.tm_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own tm_results" 
ON public.tm_results FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own tm_results" 
ON public.tm_results FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own tm_results" 
ON public.tm_results FOR UPDATE 
USING (auth.uid() = student_id);

-- RLS for tm_progress
ALTER TABLE public.tm_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own tm_progress" 
ON public.tm_progress FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own tm_progress" 
ON public.tm_progress FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own tm_progress" 
ON public.tm_progress FOR UPDATE 
USING (auth.uid() = student_id);
