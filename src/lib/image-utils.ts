// Utility functions for image handling when storage is not available

export class ImageUtils {
  // Convert file to base64 string
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Resize image to reduce file size
  static async resizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Upload profile picture with fallback to base64
  static async uploadProfilePictureFallback(file: File, _userId: string): Promise<{ url?: string; error?: string }> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Please select an image file' }
      }

      // Validate file size (2MB limit for base64)
      if (file.size > 2 * 1024 * 1024) {
        return { error: 'Image size must be less than 2MB for profile pictures' }
      }

      // Resize image to reduce size
      const resizedFile = await this.resizeImage(file, 300, 300, 0.7)
      
      // Convert to base64
      const base64String = await this.fileToBase64(resizedFile)
      
      // Return the base64 string as URL
      return { url: base64String }
    } catch (error: any) {
      console.error('Error processing image:', error)
      return { error: error.message || 'Failed to process image' }
    }
  }

  // Upload project image with fallback to base64
  static async uploadProjectImageFallback(file: File, _userId: string): Promise<{ url?: string; error?: string }> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Please select an image file' }
      }

      // Validate file size (3MB limit for base64 project images)
      if (file.size > 3 * 1024 * 1024) {
        return { error: 'Image size must be less than 3MB for project images' }
      }

      // Resize image to reduce size (larger than profile pics but still reasonable)
      const resizedFile = await this.resizeImage(file, 800, 600, 0.8)
      
      // Convert to base64
      const base64String = await this.fileToBase64(resizedFile)
      
      // Return the base64 string as URL
      return { url: base64String }
    } catch (error: any) {
      console.error('Error processing project image:', error)
      return { error: error.message || 'Failed to process image' }
    }
  }

  // Check if URL is base64
  static isBase64Image(url: string): boolean {
    return url.startsWith('data:image/')
  }

  // Get optimized image URL (handles both storage URLs and base64)
  static getOptimizedImageUrl(url: string, options?: {
    width?: number
    height?: number
    quality?: number
  }): string {
    // If it's a base64 image, return as-is
    if (this.isBase64Image(url)) {
      return url
    }

    // If it's a storage URL, apply optimizations
    if (!url || !url.includes('supabase')) return url

    const params = new URLSearchParams()
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.quality) params.append('quality', options.quality.toString())

    return params.toString() ? `${url}?${params.toString()}` : url
  }
}