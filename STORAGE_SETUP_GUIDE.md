# 📁 Storage Setup Guide - Image Upload Fix

## ✅ What You Need to Do in Supabase Dashboard

### 1. **Storage Buckets Created** ✅
You've already created these buckets:
- `profile-images` (for user profile pictures)
- `project-images` (for project update images)

### 2. **Set Up Storage Policies** 🔧
Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for profile-images bucket
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for project-images bucket
CREATE POLICY "Users can upload project images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all project images" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Users can update their own project images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. **Bucket Settings** ⚙️
Make sure both buckets have these settings:
- **Public**: ✅ Yes (so images can be displayed)
- **File size limit**: 
  - `profile-images`: 5MB
  - `project-images`: 10MB
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## ✅ What's Been Fixed in the Code

### 1. **Storage Service Updated**
- ✅ Fixed bucket names to match your Supabase buckets
- ✅ Added proper error handling with user-friendly messages
- ✅ Added file validation (type and size limits)
- ✅ Better return types with `{ url?, error? }` format

### 2. **Image Upload Component Fixed**
- ✅ Updated to handle new error format
- ✅ Shows specific error messages to users
- ✅ Better user feedback with toast notifications

### 3. **Profile Page Modernized**
- ✅ Updated to match your flat design system
- ✅ Modern header with floating icon
- ✅ Enhanced avatar with ring effects
- ✅ Flat color badges for roles

## 🎯 How It Works Now

### **Profile Image Upload:**
1. User clicks camera icon on profile page
2. Selects image file (validates type and size)
3. Uploads to `profile-images/[userId]/profile.[ext]`
4. Updates user profile with new image URL
5. Image displays immediately

### **Project Image Upload:**
1. User uploads image in project updates
2. Validates file (type and size)
3. Uploads to `project-images/[userId]/projects/[timestamp].[ext]`
4. Returns URL for use in project posts

## 🚀 Test It Out

After running the SQL policies:
1. **Go to your Profile page**
2. **Click the camera icon**
3. **Upload a profile image**
4. **Should work without "Failed to upload image" error!**

## 🔧 Troubleshooting

If you still get errors:
1. **Check browser console** for specific error messages
2. **Verify bucket names** match exactly: `profile-images` and `project-images`
3. **Ensure RLS policies** are applied correctly
4. **Check file size** (under 5MB for profiles, 10MB for projects)
5. **Verify file type** (only images: jpg, png, webp)

The image upload should now work perfectly with your beautiful flat design! 🎉