-- Migration: School Operations (SIMS)
-- Includes Announcements, Teaching Journals, Attendances, and Assignment Submissions

-- 1. Announcements (Mading)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Teaching Journals (Jurnal Mengajar)
CREATE TABLE IF NOT EXISTS public.teaching_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Attendances (Absensi)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_id UUID REFERENCES public.teaching_journals(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'sick', 'absent', 'permission')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(journal_id, student_id)
);

-- 4. Assignment Submissions (Pengumpulan Tugas)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    text_content TEXT,
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(lesson_id, student_id)
);

-- 5. Add Due Date to Lessons (for Assignments)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for Announcements (Everyone can view, only Principal/TU can insert/update)
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Principal and TU can insert announcements" ON public.announcements FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
CREATE POLICY "Principal and TU can update announcements" ON public.announcements FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);
CREATE POLICY "Principal and TU can delete announcements" ON public.announcements FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'tu'))
);

-- Policies for Teaching Journals (Everyone can view, teachers can insert their own, Principal can view all)
CREATE POLICY "Journals are viewable by everyone" ON public.teaching_journals FOR SELECT USING (true);
CREATE POLICY "Teachers can insert their own journals" ON public.teaching_journals FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own journals" ON public.teaching_journals FOR UPDATE USING (auth.uid() = teacher_id);

-- Policies for Attendances (Viewable by everyone, teachers can insert/update)
CREATE POLICY "Attendances are viewable by everyone" ON public.attendances FOR SELECT USING (true);
CREATE POLICY "Teachers can insert attendances" ON public.attendances FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu', 'principal'))
);
CREATE POLICY "Teachers can update attendances" ON public.attendances FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu', 'principal'))
);

-- Policies for Assignment Submissions
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions FOR SELECT USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu', 'principal'))
);
CREATE POLICY "Students can insert their own submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own submissions before graded" ON public.assignment_submissions FOR UPDATE USING (
    auth.uid() = student_id AND score IS NULL
);
CREATE POLICY "Teachers can update submissions (for grading)" ON public.assignment_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'tu'))
);
