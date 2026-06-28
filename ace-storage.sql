-- Create ACE Storage Bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ace_storage', 'ace_storage', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage (PostgreSQL policies for Supabase Storage)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'ace_storage');

CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'ace_storage' AND auth.uid() = owner);

CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'ace_storage' AND auth.uid() = owner);

CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'ace_storage' AND auth.uid() = owner);
