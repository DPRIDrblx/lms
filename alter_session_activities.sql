ALTER TABLE session_cbt_packages 
ADD COLUMN activity_type text DEFAULT 'cbt',
ADD COLUMN file_url text,
ADD COLUMN link_url text;
