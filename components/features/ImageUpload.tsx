'use client'

import { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  alpha,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  bucket?: 'equipment-images' | 'project-images'
  entityId?: string
  label?: string
  maxImages?: number
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export function ImageUpload({
  images,
  onChange,
  bucket = 'equipment-images',
  entityId,
  label = 'Images',
  maxImages,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()

  const getPublicUrl = (path: string) => {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  }

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) return

    // Check max images limit
    if (maxImages && images.length + imageFiles.length > maxImages) {
      const allowed = maxImages - images.length
      if (allowed <= 0) return
      imageFiles.splice(allowed)
    }

    setUploading(true)
    const newImages: string[] = []

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${entityId || 'new'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file)

        if (error) {
          console.error('Upload error:', error)
          continue
        }

        newImages.push(filePath)
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
      }
    } finally {
      setUploading(false)
    }
  }, [images, onChange, entityId, bucket, maxImages, supabase.storage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files)
    }
  }, [uploadFiles])

  const handleRemove = useCallback(async (index: number) => {
    const imagePath = images[index]

    // Try to delete from storage
    await supabase.storage
      .from(bucket)
      .remove([imagePath])

    // Update state regardless of delete success
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }, [images, onChange, bucket, supabase.storage])

  const isAtLimit = maxImages !== undefined && images.length >= maxImages

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
        {maxImages && ` (${images.length}/${maxImages})`}
      </Typography>

      {/* Drop zone */}
      {!isAtLimit && (
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : alpha('#000', 0.2),
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: dragOver ? alpha('#1A73E8', 0.05) : alpha('#000', 0.02),
            transition: 'all 200ms ease-in-out',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: alpha('#1A73E8', 0.05),
            },
          }}
          onClick={() => document.getElementById(`image-upload-${bucket}`)?.click()}
        >
          <input
            id={`image-upload-${bucket}`}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <CircularProgress size={32} />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Drag & drop images here, or click to select
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports JPG, PNG, GIF, WebP
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 1,
            mt: 2,
          }}
        >
          {images.map((imagePath, index) => (
            <Box
              key={imagePath}
              sx={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: alpha('#000', 0.05),
              }}
            >
              <Box
                component="img"
                src={getPublicUrl(imagePath)}
                alt={`Equipment image ${index + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(index)
                }}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'error.main',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
