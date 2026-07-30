-- Migration for Dynamic Form Builder System

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    logo_type TEXT CHECK (logo_type IN ('IGNITE', 'IGNITE Center', 'NIA Center')) DEFAULT 'IGNITE',
    require_sso BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.form_pages(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'name', 'email', 'phone', 'address', 'school', 'mcq', 'complex_mcq', 'rating', 'short_text', 'long_text', 'file_upload'
    title TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    options JSONB, -- stores choices for mcq, complex_mcq, etc.
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
    respondent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- nullable if public
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID REFERENCES public.form_responses(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.form_questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT,
    answer_data JSONB -- stores structured data like {province, city, district}, {school_name, npsn}, or file URLs
);

-- 2. Add Storage Bucket for File Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for form-uploads
CREATE POLICY "Public Access for form-uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'form-uploads');

CREATE POLICY "Allow public uploads to form-uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'form-uploads');

CREATE POLICY "Allow users to delete own uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'form-uploads');

-- 3. Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

-- Forms Policies
CREATE POLICY "TU can manage forms" ON public.forms 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin'))
);
CREATE POLICY "Anyone can view published forms" ON public.forms 
FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin')));

-- Form Pages Policies
CREATE POLICY "TU can manage form pages" ON public.form_pages 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin'))
);
CREATE POLICY "Anyone can view form pages" ON public.form_pages 
FOR SELECT USING (true);

-- Form Questions Policies
CREATE POLICY "TU can manage form questions" ON public.form_questions 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin'))
);
CREATE POLICY "Anyone can view form questions" ON public.form_questions 
FOR SELECT USING (true);

-- Form Responses Policies
CREATE POLICY "TU can manage form responses" ON public.form_responses 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin'))
);
CREATE POLICY "Anyone can insert form responses" ON public.form_responses 
FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own responses" ON public.form_responses 
FOR SELECT USING (auth.uid() = respondent_id);

-- Form Answers Policies
CREATE POLICY "TU can manage form answers" ON public.form_answers 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('tu', 'principal', 'admin'))
);
CREATE POLICY "Anyone can insert form answers" ON public.form_answers 
FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own answers" ON public.form_answers 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.form_responses WHERE id = response_id AND respondent_id = auth.uid())
);

-- 4. Create trigger to update 'updated_at' on forms
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_forms_updated_at ON public.forms;
CREATE TRIGGER trigger_update_forms_updated_at
BEFORE UPDATE ON public.forms
FOR EACH ROW
EXECUTE FUNCTION update_forms_updated_at();

-- 5. Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.forms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_responses;
