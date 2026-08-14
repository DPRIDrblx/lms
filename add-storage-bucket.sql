-- Create storage bucket for class documentation if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('class_documentation', 'class_documentation', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
CREATE POLICY "class_doc_public_access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'class_documentation');

CREATE POLICY "class_doc_upload_access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'class_documentation' AND auth.role() = 'authenticated');

CREATE POLICY "class_doc_update_access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'class_documentation' AND auth.role() = 'authenticated');
