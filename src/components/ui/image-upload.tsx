import React, { useRef, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Alert, AlertDescription } from './alert'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { StorageService } from '@/lib/storage'
import { ImageUtils } from '@/lib/image-utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: (url: string) => void
  currentImages?: string[]
  maxImages?: number
  bucket: 'profiles' | 'projects'
  userId: string
  className?: string
  accept?: string
  onUploadStateChange?: (uploading: boolean) => void
}

export function ImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImages = [],
  maxImages = 5,
  bucket,
  userId,
  className = '',
  accept = 'image/*',
  onUploadStateChange
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (currentImages.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB for profiles, 10MB for projects)
    const maxSize = bucket === 'profiles' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Image size must be less than ${maxSize / (1024 * 1024)}MB`)
      return
    }

    setUploading(true)
    onUploadStateChange?.(true)
    try {
      let result: { url?: string; error?: string }
      
      if (bucket === 'profiles') {
        // Try storage first, fallback to base64 if RLS issues
        result = await StorageService.uploadProfilePicture(file, userId)
        
        if (result.error && result.error.includes('row-level security')) {
          console.log('Storage RLS issue, using base64 fallback...')
          result = await ImageUtils.uploadProfilePictureFallback(file, userId)
        }
      } else {
        result = await StorageService.uploadProjectImage(file, userId)
      }

      if (result.error) {
        toast.error(result.error)
      } else if (result.url) {
        onImageUploaded(result.url)
        toast.success('Image uploaded successfully!')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      onUploadStateChange?.(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async (url: string) => {
    if (onImageRemoved) {
      onImageRemoved(url)
    }
    
    // Optionally delete from storage
    await StorageService.deleteImage(url, bucket)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || currentImages.length >= maxImages}
              className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:text-gray-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Or drag and drop an image here
          </p>
          <p className="text-xs text-gray-400">
            {bucket === 'profiles' ? 'Max 5MB' : 'Max 10MB'} • JPG, PNG, WebP, GIF
          </p>
        </div>
      </div>

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Images ({currentImages.length}/{maxImages})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={ImageUtils.getOptimizedImageUrl(url, { width: 200, height: 150, quality: 80 })}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Error'
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => handleRemoveImage(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          Images are stored securely in Supabase Storage and automatically optimized for web delivery.
          {bucket === 'profiles' 
            ? ' Profile pictures are resized to maintain consistent display across the app.'
            : ' Project images support multiple formats and are perfect for showcasing your work progress.'
          }
        </AlertDescription>
      </Alert>
    </div>
  )
}