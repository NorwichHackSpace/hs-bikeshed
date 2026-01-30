'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Autocomplete,
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import type { Project } from '@/types/database'
import { ImageUpload } from './ImageUpload'

interface ProjectDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Project>) => Promise<void>
  project?: Project | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const validationSchema = Yup.object({
  title: Yup.string().required('Title is required').max(100, 'Title must be less than 100 characters'),
  description: Yup.string().max(2000, 'Description must be less than 2000 characters'),
  visibility: Yup.string().oneOf(['public', 'hackspace', 'private']).required(),
  status: Yup.string().oneOf(['active', 'completed', 'on_hold', 'archived']).required(),
  tags: Yup.array().of(Yup.string()),
})

const suggestedTags = [
  'Electronics',
  '3D Printing',
  'Woodworking',
  'Metalworking',
  'Laser Cutting',
  'CNC',
  'Programming',
  'Arduino',
  'Raspberry Pi',
  'IoT',
  'Robotics',
  'Art',
  'Textiles',
  'Repair',
  'Upcycling',
]

// Helper to extract path from full URL or return path as-is
const extractImagePath = (urlOrPath: string | null): string[] => {
  if (!urlOrPath) return []
  // If it's a full URL, extract the path
  if (urlOrPath.startsWith('http')) {
    const match = urlOrPath.match(/project-images\/(.+)$/)
    return match ? [match[1]] : []
  }
  return [urlOrPath]
}

// Helper to convert path to full URL
const pathToUrl = (path: string): string => {
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/project-images/${path}`
}

export function ProjectDialog({ open, onClose, onSave, project }: ProjectDialogProps) {
  const formik = useFormik({
    initialValues: {
      title: project?.title || '',
      description: project?.description || '',
      visibility: project?.visibility || 'hackspace',
      status: project?.status || 'active',
      tags: project?.tags || [],
      coverImages: extractImagePath(project?.cover_image_url ?? null),
    },
    validationSchema,
    onSubmit: async (values) => {
      const { coverImages, ...rest } = values
      await onSave({
        ...rest,
        cover_image_url: coverImages.length > 0 ? pathToUrl(coverImages[0]) : null,
      })
      onClose()
      formik.resetForm()
    },
    enableReinitialize: true,
  })

  useEffect(() => {
    if (open) {
      formik.resetForm({
        values: {
          title: project?.title || '',
          description: project?.description || '',
          visibility: project?.visibility || 'hackspace',
          status: project?.status || 'active',
          tags: project?.tags || [],
          coverImages: extractImagePath(project?.cover_image_url ?? null),
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              name="title"
              label="Project Title"
              fullWidth
              required
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />

            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={
                (formik.touched.description && formik.errors.description) ||
                'Tell others what your project is about'
              }
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  name="visibility"
                  label="Visibility"
                  value={formik.values.visibility}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="public">Public - Anyone can see</MenuItem>
                  <MenuItem value="hackspace">Members Only - Logged in members</MenuItem>
                  <MenuItem value="private">Private - Only you</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  label="Status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Autocomplete
              multiple
              freeSolo
              options={suggestedTags}
              value={formik.values.tags}
              onChange={(_, newValue) => {
                formik.setFieldValue('tags', newValue)
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip
                      key={key}
                      label={option}
                      size="small"
                      {...tagProps}
                    />
                  )
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags..."
                  helperText="Press Enter to add custom tags"
                />
              )}
            />

            <ImageUpload
              images={formik.values.coverImages}
              onChange={(images) => formik.setFieldValue('coverImages', images)}
              bucket="project-images"
              entityId={project?.id}
              label="Cover Image"
              maxImages={1}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
