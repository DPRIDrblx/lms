-- =================================================================================
-- IGNITE EXPANSION: Smart Notes Feature
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT, -- HTML content from Tiptap
    folder TEXT DEFAULT 'General',
    color TEXT DEFAULT 'bg-white',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for student_notes
DROP TRIGGER IF EXISTS update_student_notes_modtime ON public.student_notes;
CREATE TRIGGER update_student_notes_modtime
    BEFORE UPDATE ON public.student_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable RLS
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Add Policies
CREATE POLICY "Users can view their own notes" ON public.student_notes FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users can insert their own notes" ON public.student_notes FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can update their own notes" ON public.student_notes FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Users can delete their own notes" ON public.student_notes FOR DELETE USING (auth.uid() = student_id);
