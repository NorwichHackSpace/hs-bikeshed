'use client'

import { useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useEquipmentStore, useBookingStore } from '@/stores'
import type { Booking, Equipment } from '@/types/database'

interface BookingDialogProps {
  open: boolean
  onClose: () => void
  selectedDate: Date | null
  booking?: Booking | null
  preselectedEquipment?: Equipment | null
}

// Generate time slots in 15-minute increments
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const validationSchema = Yup.object({
  equipment: Yup.object().nullable().required('Equipment is required'),
  date: Yup.string().required('Date is required'),
  startTime: Yup.string().required('Start time is required'),
  endTime: Yup.string()
    .required('End time is required')
    .test('is-after-start', 'End time must be after start time', function (value) {
      const { startTime } = this.parent
      if (!startTime || !value) return true
      return value > startTime
    }),
  notes: Yup.string(),
})

interface BookingFormValues {
  equipment: Equipment | null
  date: string
  startTime: string
  endTime: string
  notes: string
}

export function BookingDialog({
  open,
  onClose,
  selectedDate,
  booking,
  preselectedEquipment,
}: BookingDialogProps) {
  const { equipment, fetchEquipment } = useEquipmentStore()
  const { createBooking, updateBooking, deleteBooking } = useBookingStore()

  const isEdit = Boolean(booking)
  const hasPreselectedEquipment = Boolean(preselectedEquipment)

  // Filter to only show operational equipment that requires booking
  const availableEquipment = useMemo(
    () => equipment.filter((e) => e.status === 'operational' && e.require_booking === true),
    [equipment]
  )

  const formik = useFormik<BookingFormValues>({
    initialValues: {
      equipment: null,
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      if (!values.equipment) return

      const startDateTime = new Date(`${values.date}T${values.startTime}:00`)
      const endDateTime = new Date(`${values.date}T${values.endTime}:00`)

      try {
        if (isEdit && booking) {
          await updateBooking(booking.id, {
            equipment_id: values.equipment.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: values.notes || null,
          })
        } else {
          await createBooking({
            equipment_id: values.equipment.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: values.notes || null,
          })
        }
        onClose()
      } catch (err) {
        setStatus({ error: (err as Error).message })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (equipment.length === 0) {
      fetchEquipment()
    }
  }, [equipment.length, fetchEquipment])

  useEffect(() => {
    if (!open) return

    if (booking) {
      const bookedEquipment = equipment.find((e) => e.id === booking.equipment_id)
      const startDate = new Date(booking.start_time)
      const endDate = new Date(booking.end_time)

      formik.resetForm({
        values: {
          equipment: bookedEquipment ?? null,
          date: startDate.toISOString().split('T')[0],
          startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
          endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
          notes: booking.notes ?? '',
        },
      })
    } else {
      // Default values for new booking
      const defaultDate = selectedDate ?? new Date()
      formik.resetForm({
        values: {
          equipment: preselectedEquipment ?? null,
          date: defaultDate.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          notes: '',
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, selectedDate, open, equipment, preselectedEquipment])

  const handleDelete = async () => {
    if (!booking) return
    if (!confirm('Are you sure you want to delete this booking?')) return

    formik.setSubmitting(true)
    try {
      await deleteBooking(booking.id)
      onClose()
    } catch (err) {
      formik.setStatus({ error: (err as Error).message })
    } finally {
      formik.setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {formik.status?.error && (
              <Alert severity="error" onClose={() => formik.setStatus(null)}>
                {formik.status.error}
              </Alert>
            )}

            <Autocomplete
              options={availableEquipment}
              value={formik.values.equipment}
              onChange={(_, newValue) => formik.setFieldValue('equipment', newValue)}
              getOptionLabel={(option) =>
                `${option.name}${option.model ? ` (${option.model})` : ''}`
              }
              groupBy={(option) => option.category ?? 'Other'}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disabled={hasPreselectedEquipment}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipment"
                  required
                  placeholder={hasPreselectedEquipment ? '' : 'Search equipment...'}
                  error={formik.touched.equipment && Boolean(formik.errors.equipment)}
                  helperText={formik.touched.equipment && formik.errors.equipment}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props
                return (
                  <li key={key} {...rest}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      {option.model && (
                        <Typography variant="caption" color="text.secondary">
                          {option.model}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )
              }}
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              name="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              fullWidth
              required
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                name="startTime"
                value={formik.values.startTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                helperText={formik.touched.startTime && formik.errors.startTime}
                select
                fullWidth
                required
              >
                {TIME_SLOTS.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="End Time"
                name="endTime"
                value={formik.values.endTime}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                helperText={formik.touched.endTime && formik.errors.endTime}
                select
                fullWidth
                required
              >
                {TIME_SLOTS.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Time slots are in 15-minute increments
            </Typography>

            <TextField
              label="Notes"
              name="notes"
              value={formik.values.notes}
              onChange={formik.handleChange}
              multiline
              rows={2}
              fullWidth
              placeholder="Optional notes about your booking..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isEdit && (
            <Button
              onClick={handleDelete}
              color="error"
              disabled={formik.isSubmitting}
              sx={{ mr: 'auto' }}
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting || !formik.isValid}
          >
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Booking'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
