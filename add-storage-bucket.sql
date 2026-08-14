-- Create storage bucket for class documentation if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('class_documentation', 'class_documentation', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'class_documentation');

CREATE POLICY "Tutor and Operator Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'class_documentation' AND auth.role() = 'authenticated');

CREATE POLICY "Tutor and Operator Update Access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'class_documentation' AND auth.role() = 'authenticated');
