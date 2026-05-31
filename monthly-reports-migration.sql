-- Migration for Monthly Reports System

CREATE TABLE IF NOT EXISTS public.monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- e.g., "Agustus 2026"
    
    -- Extracted data
    grades_summary JSONB DEFAULT '{}'::jsonb,
    attendance_summary JSONB DEFAULT '{}'::jsonb,
    
    -- Teacher notes & Principal remarks
    homeroom_notes TEXT,
    principal_remarks TEXT DEFAULT 'Terus tingkatkan prestasi belajar Anda di Mainan Middle International School.',
    
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Homeroom can manage monthly reports" ON public.monthly_reports
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = public.monthly_reports.class_id 
    AND (wali_kelas_id = auth.uid() OR co_homeroom_id = auth.uid())
  )
);

CREATE POLICY "Parents can view published reports" ON public.monthly_reports
FOR SELECT USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.parent_student_links 
    WHERE parent_id = auth.uid() AND student_id = public.monthly_reports.student_id
  )
);

CREATE POLICY "Students can view published reports" ON public.monthly_reports
FOR SELECT USING (
  is_published = true AND student_id = auth.uid()
);

-- Add missing policy on report_cards for Co-Homeroom
-- Make sure report_cards policy allows co-homeroom
CREATE POLICY "Co-Homeroom can manage report cards" ON public.report_cards
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = public.report_cards.class_id 
    AND co_homeroom_id = auth.uid()
  )
);
