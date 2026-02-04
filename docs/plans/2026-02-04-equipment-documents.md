# Equipment Documents Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add document management to equipment pages so maintainers can upload manuals, settings files, and templates.

**Architecture:** Documents are stored in Supabase Storage (`equipment-documents` bucket) with metadata in a `documents` table. The UI integrates into the existing equipment detail page with a new "Documents" section. Only maintainers and admins can upload/edit; all members can view.

**Tech Stack:** Next.js 16, TypeScript, MUI, Zustand, Supabase Storage, Formik/Yup

---

## Task 1: Add Document Type

**Files:**
- Modify: `types/database.ts`

**Step 1: Add Document type to database.ts**

Add the Document table type and convenience export at the end of the file:

```typescript
// After the transaction_imports table definition (around line 645), add:

      documents: {
        Row: {
          id: string
          equipment_id: string
          filename: string
          storage_path: string
          file_size: number
          mime_type: string
          title: string
          description: string | null
          tags: string[]
          is_public: boolean
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          filename: string
          storage_path: string
          file_size: number
          mime_type: string
          title: string
          description?: string | null
          tags?: string[]
          is_public?: boolean
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          filename?: string
          storage_path?: string
          file_size?: number
          mime_type?: string
          title?: string
          description?: string | null
          tags?: string[]
          is_public?: boolean
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

```typescript
// Add convenience type export after existing exports (around line 687):

export type Document = Database["public"]["Tables"]["documents"]["Row"]
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add types/database.ts
git commit -m "feat: add Document type to database types"
```

---

## Task 2: Create Document Store

**Files:**
- Create: `stores/documentStore.ts`
- Modify: `stores/index.ts`

**Step 1: Create documentStore.ts**

```typescript
import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

interface DocumentMetadata {
  title: string
  description?: string
  tags: string[]
  is_public: boolean
}

interface DocumentState {
  documents: Document[]
  loading: boolean
  uploading: boolean
  error: string | null
}

interface DocumentActions {
  fetchDocumentsForEquipment: (equipmentId: string) => Promise<void>
  uploadDocument: (equipmentId: string, file: File, metadata: DocumentMetadata) => Promise<void>
  updateDocument: (id: string, updates: Partial<DocumentMetadata>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  clearDocuments: () => void
}

type DocumentStore = DocumentState & DocumentActions

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  error: null,

  fetchDocumentsForEquipment: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ documents: data ?? [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  uploadDocument: async (equipmentId, file, metadata) => {
    const supabase = getClient()
    set({ uploading: true, error: null })

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique document ID and storage path
      const documentId = crypto.randomUUID()
      const storagePath = `${equipmentId}/${documentId}/${file.name}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('equipment-documents')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          equipment_id: equipmentId,
          filename: file.name,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          title: metadata.title || file.name,
          description: metadata.description || null,
          tags: metadata.tags,
          is_public: metadata.is_public,
          uploaded_by: user.id,
        })

      if (insertError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('equipment-documents').remove([storagePath])
        throw insertError
      }

      // Refresh documents list
      await get().fetchDocumentsForEquipment(equipmentId)
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ uploading: false })
    }
  },

  updateDocument: async (id, updates) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Update local state
      set({
        documents: get().documents.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        ),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteDocument: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      // Get document to find storage path
      const doc = get().documents.find(d => d.id === id)
      if (!doc) throw new Error('Document not found')

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('equipment-documents')
        .remove([doc.storage_path])

      if (storageError) console.warn('Storage delete failed:', storageError)

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      // Update local state
      set({ documents: get().documents.filter(d => d.id !== id) })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  clearDocuments: () => {
    set({ documents: [], error: null })
  },
}))
```

**Step 2: Export from stores/index.ts**

Add to `stores/index.ts`:

```typescript
export { useDocumentStore } from './documentStore'
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add stores/documentStore.ts stores/index.ts
git commit -m "feat: add document store for equipment documents"
```

---

## Task 3: Create DocumentCard Component

**Files:**
- Create: `components/features/documents/DocumentCard.tsx`

**Step 1: Create DocumentCard.tsx**

```typescript
'use client'

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PublicIcon from '@mui/icons-material/Public'
import LockIcon from '@mui/icons-material/Lock'
import { useState } from 'react'
import type { Document } from '@/types/database'

interface DocumentCardProps {
  document: Document
  canEdit: boolean
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon />
  if (mimeType.startsWith('image/')) return <ImageIcon />
  return <InsertDriveFileIcon />
}

export function DocumentCard({
  document,
  canEdit,
  onPreview,
  onEdit,
  onDelete,
  onDownload,
}: DocumentCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (action: () => void) => {
    handleMenuClose()
    action()
  }

  const canPreview =
    document.mime_type === 'application/pdf' ||
    document.mime_type.startsWith('image/')

  return (
    <Card
      sx={{
        cursor: canPreview ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': canPreview ? { boxShadow: 4 } : {},
      }}
      onClick={canPreview ? onPreview : undefined}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* File icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              backgroundColor: alpha('#1A73E8', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {getFileIcon(document.mime_type)}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                noWrap
                sx={{ flex: 1 }}
              >
                {document.title}
              </Typography>
              {document.is_public ? (
                <PublicIcon fontSize="small" color="action" titleAccess="Public" />
              ) : (
                <LockIcon fontSize="small" color="action" titleAccess="Members only" />
              )}
              {canEdit && (
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  sx={{ ml: -0.5 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {document.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {document.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(document.file_size)}
              </Typography>
              {document.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {document.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                  {document.tags.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{document.tags.length - 3}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction(onDownload)}>Download</MenuItem>
        {canPreview && (
          <MenuItem onClick={() => handleAction(onPreview)}>Preview</MenuItem>
        )}
        <MenuItem onClick={() => handleAction(onEdit)}>Edit</MenuItem>
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/documents/DocumentCard.tsx
git commit -m "feat: add DocumentCard component"
```

---

## Task 4: Create DocumentUpload Component

**Files:**
- Create: `components/features/documents/DocumentUpload.tsx`

**Step 1: Create DocumentUpload.tsx**

```typescript
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

interface DocumentUploadProps {
  open: boolean
  onClose: () => void
  equipmentId: string
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

export function DocumentUpload({ open, onClose, equipmentId }: DocumentUploadProps) {
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
        await uploadDocument(equipmentId, file, {
          title: values.title,
          description: values.description || undefined,
          tags: values.tags,
          is_public: values.is_public,
        })
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/documents/DocumentUpload.tsx
git commit -m "feat: add DocumentUpload component with drag-drop"
```

---

## Task 5: Create DocumentEditDialog Component

**Files:**
- Create: `components/features/documents/DocumentEditDialog.tsx`

**Step 1: Create DocumentEditDialog.tsx**

```typescript
'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material'
import { Autocomplete } from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useDocumentStore } from '@/stores'
import type { Document } from '@/types/database'

interface DocumentEditDialogProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

const SUGGESTED_TAGS = ['manual', 'safety', 'settings', 'template', 'guide', 'reference']

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  tags: Yup.array().of(Yup.string()),
  is_public: Yup.boolean(),
})

export function DocumentEditDialog({ open, onClose, document }: DocumentEditDialogProps) {
  const { updateDocument, loading } = useDocumentStore()

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: document?.title ?? '',
      description: document?.description ?? '',
      tags: document?.tags ?? [],
      is_public: document?.is_public ?? false,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!document) return

      try {
        await updateDocument(document.id, {
          title: values.title,
          description: values.description || undefined,
          tags: values.tags,
          is_public: values.is_public,
        })
        onClose()
      } catch {
        // Error handled by store
      }
    },
  })

  const handleClose = () => {
    formik.resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Document</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
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
            label="Make publicly accessible"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/documents/DocumentEditDialog.tsx
git commit -m "feat: add DocumentEditDialog component"
```

---

## Task 6: Create DocumentPreview Component

**Files:**
- Create: `components/features/documents/DocumentPreview.tsx`

**Step 1: Create DocumentPreview.tsx**

```typescript
'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import type { Document } from '@/types/database'

interface DocumentPreviewProps {
  open: boolean
  onClose: () => void
  document: Document | null
  downloadUrl: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export function DocumentPreview({ open, onClose, document, downloadUrl }: DocumentPreviewProps) {
  if (!document || !downloadUrl) return null

  const isPdf = document.mime_type === 'application/pdf'
  const isImage = document.mime_type.startsWith('image/')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }} noWrap>
          {document.title}
        </Typography>
        <IconButton
          component="a"
          href={downloadUrl}
          download={document.filename}
          title="Download"
        >
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={onClose} title="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        {isPdf && (
          <Box
            component="iframe"
            src={`${downloadUrl}#view=FitH`}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={document.title}
          />
        )}

        {isImage && (
          <Box
            component="img"
            src={downloadUrl}
            alt={document.title}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {!isPdf && !isImage && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Preview not available for this file type
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              component="a"
              href={downloadUrl}
              download={document.filename}
            >
              Download File
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/documents/DocumentPreview.tsx
git commit -m "feat: add DocumentPreview component for PDF and images"
```

---

## Task 7: Create DocumentList Component

**Files:**
- Create: `components/features/documents/DocumentList.tsx`

**Step 1: Create DocumentList.tsx**

```typescript
'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useDocumentStore } from '@/stores'
import { DocumentCard } from './DocumentCard'
import { DocumentUpload } from './DocumentUpload'
import { DocumentEditDialog } from './DocumentEditDialog'
import { DocumentPreview } from './DocumentPreview'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

interface DocumentListProps {
  equipmentId: string
  canManage: boolean
}

export function DocumentList({ equipmentId, canManage }: DocumentListProps) {
  const { documents, loading, error, deleteDocument } = useDocumentStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [documents])

  // Filter documents by selected tag
  const filteredDocuments = useMemo(() => {
    if (!selectedTag) return documents
    return documents.filter((doc) => doc.tags.includes(selectedTag))
  }, [documents, selectedTag])

  const getDownloadUrl = useCallback(async (doc: Document): Promise<string> => {
    const supabase = createClient()

    if (doc.is_public) {
      // Public files can use direct URL
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/equipment-documents/${doc.storage_path}`
    }

    // Private files need signed URL
    const { data } = await supabase.storage
      .from('equipment-documents')
      .createSignedUrl(doc.storage_path, 3600) // 1 hour expiry

    return data?.signedUrl ?? ''
  }, [])

  const handlePreview = useCallback(async (doc: Document) => {
    setPreviewDocument(doc)
  }, [])

  const handleDownload = useCallback(async (doc: Document) => {
    const url = await getDownloadUrl(doc)
    window.open(url, '_blank')
  }, [getDownloadUrl])

  const handleDelete = useCallback(async (doc: Document) => {
    if (confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
      await deleteDocument(doc.id)
    }
  }, [deleteDocument])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Get preview URL when preview document changes
  useMemo(async () => {
    if (previewDocument) {
      const url = await getDownloadUrl(previewDocument)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [previewDocument, getDownloadUrl])

  if (loading && documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Documents
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Add Document
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tag filter */}
      {allTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label="All"
            variant={selectedTag === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedTag(null)}
            size="small"
          />
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
              onClick={() => setSelectedTag(tag)}
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Document grid */}
      {filteredDocuments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {documents.length === 0
            ? 'No documents uploaded yet.'
            : 'No documents match the selected filter.'}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canEdit={canManage}
              onPreview={() => handlePreview(doc)}
              onEdit={() => setEditDocument(doc)}
              onDelete={() => handleDelete(doc)}
              onDownload={() => handleDownload(doc)}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <DocumentUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        equipmentId={equipmentId}
      />

      <DocumentEditDialog
        open={editDocument !== null}
        onClose={() => setEditDocument(null)}
        document={editDocument}
      />

      <DocumentPreview
        open={previewDocument !== null}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
        downloadUrl={previewUrl}
      />
    </Box>
  )
}
```

**Step 2: Create index.ts for exports**

Create `components/features/documents/index.ts`:

```typescript
export { DocumentCard } from './DocumentCard'
export { DocumentList } from './DocumentList'
export { DocumentUpload } from './DocumentUpload'
export { DocumentEditDialog } from './DocumentEditDialog'
export { DocumentPreview } from './DocumentPreview'
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/features/documents/
git commit -m "feat: add DocumentList component with filtering"
```

---

## Task 8: Integrate Documents into Equipment Detail Page

**Files:**
- Modify: `app/(dashboard)/equipment/[category]/[id]/page.tsx`

**Step 1: Add imports and state**

At the top of the file, add:

```typescript
import { useDocumentStore } from '@/stores'
import { DocumentList } from '@/components/features/documents'
```

**Step 2: Add document store usage**

Inside the component, after the existing store hooks:

```typescript
const { fetchDocumentsForEquipment, clearDocuments } = useDocumentStore()
```

**Step 3: Fetch documents in useEffect**

Update the useEffect to include document fetching:

```typescript
useEffect(() => {
  if (equipmentId) {
    fetchEquipmentById(equipmentId)
    fetchMyInductions()
    fetchMyRequests()
    fetchMyBookings()
    fetchDocumentsForEquipment(equipmentId)
  }

  return () => {
    clearSelected()
    clearDocuments()
  }
}, [equipmentId, fetchEquipmentById, fetchMyInductions, fetchMyRequests, fetchMyBookings, fetchDocumentsForEquipment, clearSelected, clearDocuments])
```

**Step 4: Determine if user can manage documents**

Add a computed value after `hasUpcomingBooking`:

```typescript
// Check if user can manage documents (is maintainer or admin)
const canManageDocuments = selectedEquipment?.maintainers?.some(
  (m) => m.id === useAuthStore.getState().user?.id
) ?? false
// Note: Admin check is handled by RLS, but for UI purposes this is sufficient
```

Also add the import at the top:

```typescript
import { useEquipmentStore, useInductionStore, useBookingStore, useAuthStore } from '@/stores'
```

**Step 5: Add DocumentList to the page layout**

After the Maintainers card (around line 293), add a new Documents section:

```typescript
{/* Documents */}
<Card sx={{ mt: 3 }}>
  <CardContent>
    <DocumentList
      equipmentId={equipmentId}
      canManage={canManageDocuments}
    />
  </CardContent>
</Card>
```

**Step 6: Verify app runs**

Run: `npm run dev`
Navigate to an equipment detail page and verify the Documents section appears.

**Step 7: Commit**

```bash
git add app/(dashboard)/equipment/[category]/[id]/page.tsx
git commit -m "feat: integrate documents section into equipment detail page"
```

---

## Task 9: Final Verification and Cleanup

**Step 1: Run linting**

Run: `npm run lint`
Expected: No errors (or only pre-existing ones)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Manual testing checklist**

Test as a maintainer:
- [ ] Navigate to equipment you maintain
- [ ] See "Add Document" button
- [ ] Upload a PDF document with title, description, tags
- [ ] Upload an image
- [ ] Edit document metadata
- [ ] Delete a document
- [ ] Preview PDF in modal
- [ ] Preview image in modal
- [ ] Download a document
- [ ] Filter by tag

Test as a regular member:
- [ ] Navigate to any equipment
- [ ] See documents list (no Add button)
- [ ] Can preview and download
- [ ] Cannot edit or delete

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete equipment documents feature

- Add Document type and documentStore
- Add DocumentCard, DocumentList, DocumentUpload components
- Add DocumentEditDialog and DocumentPreview
- Integrate into equipment detail page
- Maintainers can upload/edit/delete
- Members can view/download
- Tag filtering supported"
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| 1 | Add Document type | `types/database.ts` |
| 2 | Create document store | `stores/documentStore.ts`, `stores/index.ts` |
| 3 | Create DocumentCard | `components/features/documents/DocumentCard.tsx` |
| 4 | Create DocumentUpload | `components/features/documents/DocumentUpload.tsx` |
| 5 | Create DocumentEditDialog | `components/features/documents/DocumentEditDialog.tsx` |
| 6 | Create DocumentPreview | `components/features/documents/DocumentPreview.tsx` |
| 7 | Create DocumentList | `components/features/documents/DocumentList.tsx`, `index.ts` |
| 8 | Integrate into equipment page | `app/(dashboard)/equipment/[category]/[id]/page.tsx` |
| 9 | Final verification | All |
