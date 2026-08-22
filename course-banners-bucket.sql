-- Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course_banners', 'course_banners', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the course_banners bucket (assuming you want authenticated users to upload/update/delete)

-- 1. Allow everyone to view/download banners
CREATE POLICY "Public Access for Course Banners" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'course_banners');

-- 2. Allow authenticated users to upload new banners
CREATE POLICY "Allow Authenticated Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'course_banners' 
    AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update banners
CREATE POLICY "Allow Authenticated Updates" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'course_banners' 
    AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete banners
CREATE POLICY "Allow Authenticated Deletes" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'course_banners' 
    AND auth.role() = 'authenticated'
);
