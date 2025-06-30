# Fix Storage Issues

## Problem
You're getting "new row violates row-level security policy" when uploading profile pictures.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
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
```

## Steps to Fix:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the SQL above**
4. **Run the query**
5. **Refresh your application**

## What This Does:

1. **Creates the storage buckets** with correct permissions
2. **Drops old conflicting policies**
3. **Creates new, simple policies** that allow authenticated users to upload/manage files
4. **Sets proper file size limits** (5MB for profiles, 10MB for projects)

## Code Changes Made:

1. **Fixed profile reload issue** - No more page refresh, uses context refresh instead
2. **Auto-save profile pictures** - Pictures are saved immediately after upload
3. **Better error handling** - More informative error messages

After running the SQL, try uploading your profile picture again. It should work without the RLS error, and you shouldn't see the blank page anymore!