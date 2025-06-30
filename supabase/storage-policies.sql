-- Storage policies for profile-images and project-images buckets

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Simple policies for profile-images bucket
CREATE POLICY "Allow authenticated users to upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow everyone to view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated users to update profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- Simple policies for project-images bucket
CREATE POLICY "Allow authenticated users to upload project images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow everyone to view project images" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Allow authenticated users to update project images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete project images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);