'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Box,
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import type { Equipment } from '@/types/database'
import { ImageUpload } from './ImageUpload'

interface EquipmentDialogProps {
  open: boolean
  onClose: () => void
  onSave: (equipment: Partial<Equipment>) => Promise<void>
  equipment?: Equipment | null
}

const CATEGORIES = [
  'Laser Cutting',
  '3D Printing',
  'Woodworking',
  'Metalworking',
  'Electronics',
  'Textiles',
  'CNC',
  'Hand Tools',
  'Other',
]

const RISK_LEVELS = ['Low', 'Medium', 'High']

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' },
  { value: 'out_of_service', label: 'Out of Service' },
  { value: 'retired', label: 'Retired' },
]

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  model: Yup.string(),
  category: Yup.string(),
  description: Yup.string(),
  riskLevel: Yup.string(),
  inductionRequired: Yup.boolean(),
  requireBooking: Yup.boolean(),
  status: Yup.string(),
  metadata: Yup.string().test('is-valid-json', 'Must be valid JSON', (value) => {
    if (!value || !value.trim()) return true
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }),
  images: Yup.array().of(Yup.string()),
})

interface EquipmentFormValues {
  name: string
  model: string
  category: string
  description: string
  riskLevel: string
  inductionRequired: boolean
  requireBooking: boolean
  status: string
  metadata: string
  images: string[]
}

export function EquipmentDialog({
  open,
  onClose,
  onSave,
  equipment,
}: EquipmentDialogProps) {
  const isEdit = Boolean(equipment)

  const formik = useFormik<EquipmentFormValues>({
    initialValues: {
      name: '',
      model: '',
      category: '',
      description: '',
      riskLevel: '',
      inductionRequired: false,
      requireBooking: false,
      status: 'operational',
      metadata: '',
      images: [],
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      let parsedMetadata = null
      if (values.metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(values.metadata)
        } catch {
          // Validation should catch this
        }
      }

      await onSave({
        name: values.name,
        model: values.model || null,
        category: values.category || null,
        description: values.description || null,
        risk_level: values.riskLevel || null,
        induction_required: values.inductionRequired,
        require_booking: values.requireBooking,
        status: values.status as Equipment['status'],
        metadata: parsedMetadata,
        images: values.images.length > 0 ? values.images : null,
      })

      setSubmitting(false)
      onClose()
    },
  })

  useEffect(() => {
    if (!open) return

    if (equipment) {
      formik.resetForm({
        values: {
          name: equipment.name,
          model: equipment.model ?? '',
          category: equipment.category ?? '',
          description: equipment.description ?? '',
          riskLevel: equipment.risk_level ?? '',
          inductionRequired: equipment.induction_required ?? false,
          requireBooking: equipment.require_booking ?? false,
          status: equipment.status ?? 'operational',
          metadata: equipment.metadata ? JSON.stringify(equipment.metadata, null, 2) : '',
          images: equipment.images ?? [],
        },
      })
    } else {
      formik.resetForm({
        values: {
          name: '',
          model: '',
          category: '',
          description: '',
          riskLevel: '',
          inductionRequired: false,
          requireBooking: false,
          status: 'operational',
          metadata: '',
          images: [],
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment, open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
              fullWidth
            />
            <TextField
              label="Model"
              name="model"
              value={formik.values.model}
              onChange={formik.handleChange}
              fullWidth
              placeholder="e.g. Prusa MK4, K40, etc."
            />
            <TextField
              label="Category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              select
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Risk Level"
              name="riskLevel"
              value={formik.values.riskLevel}
              onChange={formik.handleChange}
              select
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {RISK_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  name="inductionRequired"
                  checked={formik.values.inductionRequired}
                  onChange={formik.handleChange}
                />
              }
              label="Induction required to use"
            />
            <FormControlLabel
              control={
                <Switch
                  name="requireBooking"
                  checked={formik.values.requireBooking}
                  onChange={formik.handleChange}
                />
              }
              label="Requires booking before use"
            />
            {isEdit && (
              <TextField
                label="Status"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                select
                fullWidth
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Specifications (JSON)"
              name="metadata"
              value={formik.values.metadata}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.metadata && Boolean(formik.errors.metadata)}
              helperText={
                (formik.touched.metadata && formik.errors.metadata) ||
                'Optional JSON object for technical specifications'
              }
              multiline
              rows={4}
              fullWidth
              placeholder='{"power": "40W", "bed_size": "300x200mm"}'
            />
            <ImageUpload
              images={formik.values.images}
              onChange={(images) => formik.setFieldValue('images', images)}
              bucket="equipment-images"
              entityId={equipment?.id}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting || !formik.values.name}
          >
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
