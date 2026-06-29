-- 1. Create table for Document Requests
CREATE TABLE IF NOT EXISTS public.ace_document_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    form_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.ace_document_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "View document requests" ON public.ace_document_requests;
CREATE POLICY "View document requests" ON public.ace_document_requests FOR SELECT USING (
  auth.uid() = teacher_id OR 
  teacher_id IS NULL OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tu', 'principal'))
);

DROP POLICY IF EXISTS "TU manage document requests" ON public.ace_document_requests;
CREATE POLICY "TU manage document requests" ON public.ace_document_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu')
);

-- 2. Alter ace_documents
ALTER TABLE public.ace_documents ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.ace_document_requests(id) ON DELETE SET NULL;
ALTER TABLE public.ace_documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Remove the strict doc_type constraint to allow 'custom'
ALTER TABLE public.ace_documents DROP CONSTRAINT IF EXISTS ace_documents_doc_type_check;
ALTER TABLE public.ace_documents ADD CONSTRAINT ace_documents_doc_type_check CHECK (doc_type IN ('ijazah', 'sk_pengangkatan', 'sertifikat_pendidik', 'lainnya', 'custom'));

