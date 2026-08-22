-- 1. Drop old policies for e_module_responses that had wrong role
DROP POLICY IF EXISTS "Teachers/Operators can do all to responses" ON public.e_module_responses;

-- 2. Create correct policy for e_module_responses
CREATE POLICY "Teachers/Operators can do all to responses" 
ON public.e_module_responses FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'operator_les')
    )
);

-- 3. Drop old policies for storage objects
DROP POLICY IF EXISTS "Teachers/Operators can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers/Operators can update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers/Operators can delete PDFs" ON storage.objects;

-- 4. Create correct policies for storage objects (e_modules_pdfs bucket)
CREATE POLICY "Teachers/Operators can upload PDFs" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'e_modules_pdfs' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'operator_les')
    )
);

CREATE POLICY "Teachers/Operators can update PDFs" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'e_modules_pdfs' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'operator_les')
    )
);

CREATE POLICY "Teachers/Operators can delete PDFs" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'e_modules_pdfs' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'operator_les')
    )
);
