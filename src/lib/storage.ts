import { supabase } from './supabase'

export class StorageService {
  private static readonly BUCKETS = {
    PROFILES: 'profile-images',
    PROJECTS: 'project-images'
  } as const

  // Initialize storage buckets (manual setup - not called automatically)
  static async initializeBuckets() {
    try {
      // Check if buckets already exist first
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.log('Cannot check existing buckets, skipping initialization')
        return
      }

      const existingBuckets = buckets?.map(b => b.id) || []
      
      // Only create buckets that don't exist
      if (!existingBuckets.includes(this.BUCKETS.PROFILES)) {
        await supabase.storage.createBucket(this.BUCKETS.PROFILES, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })
        console.log('Created profile-images bucket')
      }

      if (!existingBuckets.includes(this.BUCKETS.PROJECTS)) {
        await supabase.storage.createBucket(this.BUCKETS.PROJECTS, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        })
        console.log('Created project-images bucket')
      }

      if (existingBuckets.includes(this.BUCKETS.PROFILES) && existingBuckets.includes(this.BUCKETS.PROJECTS)) {
        console.log('Storage buckets already exist')
      }
    } catch (error: any) {
      // Silently handle errors since buckets might already exist or user might not have permissions
      console.log('Storage buckets initialization skipped')
    }
  }

  // Upload profile picture - Modern Supabase approach
  static async uploadProfilePicture(file: File, userId: string): Promise<{ url?: string; error?: string }> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Please select an image file' }
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return { error: 'Image size must be less than 5MB' }
      }

      // Simple file naming - just use timestamp
      const fileExt = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const fileName = `profile_${timestamp}.${fileExt}`

      // Upload to public bucket (no complex policies needed)
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKETS.PROFILES)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError.message)
        return { error: `Upload failed: ${uploadError.message}` }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.PROFILES)
        .getPublicUrl(fileName)

      return { url: urlData.publicUrl }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      return { error: error.message || 'Failed to upload image' }
    }
  }

  // Upload project image - Modern Supabase approach
  static async uploadProjectImage(file: File, userId: string): Promise<{ url?: string; error?: string }> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Please select an image file' }
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return { error: 'Image size must be less than 10MB' }
      }

      // Simple file naming
      const fileExt = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const fileName = `project_${timestamp}.${fileExt}`

      // Upload to public bucket
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKETS.PROJECTS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError.message)
        return { error: `Upload failed: ${uploadError.message}` }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.PROJECTS)
        .getPublicUrl(fileName)

      return { url: urlData.publicUrl }
    } catch (error: any) {
      console.error('Error uploading project image:', error)
      return { error: error.message || 'Failed to upload image' }
    }
  }

  // Delete image from storage
  static async deleteImage(url: string, bucket: 'profiles' | 'projects'): Promise<boolean> {
    try {
      const bucketName = bucket === 'profiles' ? this.BUCKETS.PROFILES : this.BUCKETS.PROJECTS
      
      // Extract file path from URL
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  // Get optimized image URL with transformations
  static getOptimizedImageUrl(url: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): string {
    if (!url || !url.includes('supabase')) return url

    const params = new URLSearchParams()
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.quality) params.append('quality', options.quality.toString())

    return params.toString() ? `${url}?${params.toString()}` : url
  }
}