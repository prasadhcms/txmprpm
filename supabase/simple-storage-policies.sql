-- SIMPLE STORAGE POLICIES FOR TESTING
-- These are more permissive but will get image upload working immediately

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone to view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow everyone to view project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update project images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete project images" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Very simple policies - any authenticated user can do anything with these buckets
CREATE POLICY "profile_images_all_access" ON storage.objects
FOR ALL USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "project_images_all_access" ON storage.objects
FOR ALL USING (bucket_id = 'project-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Allow public viewing of images
CREATE POLICY "public_view_profile_images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "public_view_project_images" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');