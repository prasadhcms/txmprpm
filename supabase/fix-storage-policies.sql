-- Fix storage policies for profile uploads

-- First, ensure the buckets exist with correct names
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('project-images', 'project-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- Create simple, permissive policies for profile-images
CREATE POLICY "profile_images_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "profile_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "profile_images_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
);

-- Create simple, permissive policies for project-images
CREATE POLICY "project_images_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "project_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "project_images_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "project_images_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);