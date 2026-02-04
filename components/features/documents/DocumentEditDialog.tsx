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
  Autocomplete,
} from '@mui/material'
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
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })
                return (
                  <Chip
                    key={key}
                    variant="outlined"
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
