'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
  alpha,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDocumentStore } from '@/stores'
import type { Document } from '@/types/database'

interface DocumentUploadProps {
  open: boolean
  onClose: () => void
  onUploaded?: (document: Document) => void
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'model/stl',
  'application/sla',
  'application/vnd.ms-pki.stl',
  'image/vnd.dxf',
  'application/dxf',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const SUGGESTED_TAGS = ['manual', 'safety', 'settings', 'template', 'guide', 'reference']

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  tags: Yup.array().of(Yup.string()),
  is_public: Yup.boolean(),
})

export function DocumentUpload({ open, onClose, onUploaded }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const { uploadDocument, uploading } = useDocumentStore()

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      tags: [] as string[],
      is_public: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!file) {
        setFileError('Please select a file')
        return
      }

      try {
        const doc = await uploadDocument(file, {
          title: values.title,
          description: values.description || undefined,
          tags: values.tags,
          is_public: values.is_public,
        })
        if (onUploaded) onUploaded(doc)
        handleClose()
      } catch {
        // Error handled by store
      }
    },
  })

  const handleClose = () => {
    setFile(null)
    setFileError(null)
    formik.resetForm()
    onClose()
  }

  const validateFile = (f: File): boolean => {
    if (f.size > MAX_FILE_SIZE) {
      setFileError('File size must be less than 50MB')
      return false
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('File type not supported. Allowed: PDF, images, STL, DXF, SVG')
      return false
    }
    return true
  }

  const handleFileSelect = useCallback((f: File) => {
    setFileError(null)
    if (validateFile(f)) {
      setFile(f)
      if (!formik.values.title) {
        formik.setFieldValue('title', f.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }, [formik])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }, [handleFileSelect])

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Document</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {/* Drop zone */}
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
              border: '2px dashed',
              borderColor: fileError
                ? 'error.main'
                : dragOver
                  ? 'primary.main'
                  : alpha('#000', 0.2),
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: dragOver ? alpha('#1A73E8', 0.05) : alpha('#000', 0.02),
              transition: 'all 200ms ease-in-out',
              cursor: 'pointer',
              mb: 3,
            }}
            onClick={() => document.getElementById('document-upload-input')?.click()}
          >
            <input
              id="document-upload-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.stl,.dxf"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Drag & drop a file here, or click to select
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, images, STL, DXF, SVG (max 50MB)
                </Typography>
              </>
            )}
          </Box>

          {fileError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {fileError}
            </Typography>
          )}

          {/* Form fields */}
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <Autocomplete
            multiple
            freeSolo
            options={SUGGESTED_TAGS}
            value={formik.values.tags}
            onChange={(_, newValue) => formik.setFieldValue('tags', newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags..."
                helperText="Press Enter to add custom tags"
              />
            )}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formik.values.is_public}
                onChange={(e) => formik.setFieldValue('is_public', e.target.checked)}
              />
            }
            label="Make publicly accessible (visible without login)"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={uploading || !file}
            startIcon={uploading ? <CircularProgress size={16} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
