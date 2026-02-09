'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Paper,
  alpha,
  ImageList,
  ImageListItem,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useEquipmentStore, useInductionStore, useBookingStore, useAuthStore, useDocumentStore, useUsageLogStore } from '@/stores'
import type { EquipmentUsageSummary } from '@/types/database'
import { EquipmentForm } from '@/components/features/EquipmentForm'
import { BookingDialog } from '@/components/features/BookingDialog'
import { DocumentList } from '@/components/features/documents'
import { getCategorySlug } from '@/lib/utils'
import type { Equipment } from '@/types/database'

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  operational: 'success',
  out_of_service: 'warning',
  retired: 'error',
}

const categoryIcons: Record<string, string> = {
  'Laser Cutting': '🔴',
  '3D Printing': '🖨️',
  'Woodworking': '🪵',
  'Metalworking': '⚙️',
  'Electronics': '🔌',
  'Textiles': '🧵',
  'CNC': '🔧',
  'Hand Tools': '🛠️',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const getImageUrl = (path: string) => {
  return `${SUPABASE_URL}/storage/v1/object/public/equipment-images/${path}`
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedEquipment, loading, error, fetchEquipmentById, updateEquipment, clearSelected } =
    useEquipmentStore()
  const {
    myInductions,
    myRequests,
    fetchMyInductions,
    fetchMyRequests,
    createRequest,
    loading: inductionLoading,
  } = useInductionStore()
  const { myBookings, fetchMyBookings, deleteBooking } = useBookingStore()
  const { fetchDocumentsForEquipment, clearLinkedDocuments } = useDocumentStore()
  const { logUsage, fetchEquipmentUsageSummary } = useUsageLogStore()
  const [isEditing, setIsEditing] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [requestingInduction, setRequestingInduction] = useState(false)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [usageDuration, setUsageDuration] = useState('')
  const [usageNotes, setUsageNotes] = useState('')
  const [loggingUsage, setLoggingUsage] = useState(false)
  const [usageSummary, setUsageSummary] = useState<EquipmentUsageSummary | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const equipmentId = params.id as string

  // Check induction status
  const isInducted = myInductions.some((i) => i.equipment_id === equipmentId)
  const hasPendingRequest = myRequests.some(
    (r) => r.equipment_id === equipmentId && r.status === 'pending'
  )

  // Check if user has upcoming booking for this equipment
  const hasUpcomingBooking = myBookings.some(
    (b) => b.equipment_id === equipmentId && new Date(b.start_time) >= new Date()
  )

  // Check if user can manage documents (is maintainer or admin)
  const canManageDocuments = selectedEquipment?.maintainers?.some(
    (m) => m.id === useAuthStore.getState().user?.id
  ) ?? false

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentById(equipmentId)
      fetchMyInductions()
      fetchMyRequests()
      fetchMyBookings()
      fetchDocumentsForEquipment(equipmentId)
      fetchEquipmentUsageSummary(equipmentId).then(setUsageSummary)
    }

    return () => {
      clearSelected()
      clearLinkedDocuments()
    }
  }, [equipmentId, fetchEquipmentById, fetchMyInductions, fetchMyRequests, fetchMyBookings, fetchDocumentsForEquipment, fetchEquipmentUsageSummary, clearSelected, clearLinkedDocuments])

  const handleRequestInduction = async () => {
    setRequestingInduction(true)
    try {
      await createRequest(equipmentId)
      setSnackbar({
        open: true,
        message: 'Induction request submitted successfully!',
        severity: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: (err as Error).message || 'Failed to submit request',
        severity: 'error',
      })
    } finally {
      setRequestingInduction(false)
    }
  }

  const handleLogUsage = async () => {
    setLoggingUsage(true)
    try {
      await logUsage({
        equipment_id: equipmentId,
        duration_minutes: usageDuration ? parseInt(usageDuration, 10) : null,
        notes: usageNotes || null,
      })
      setSnackbar({
        open: true,
        message: 'Usage logged successfully!',
        severity: 'success',
      })
      setUsageDialogOpen(false)
      setUsageDuration('')
      setUsageNotes('')
      // Refresh summary
      fetchEquipmentUsageSummary(equipmentId).then(setUsageSummary)
    } catch (err) {
      setSnackbar({
        open: true,
        message: (err as Error).message || 'Failed to log usage',
        severity: 'error',
      })
    } finally {
      setLoggingUsage(false)
    }
  }

  const handleSave = async (data: Partial<Equipment>) => {
    await updateEquipment(equipmentId, data)
    setIsEditing(false)
    // Refresh the data and update URL if category changed
    await fetchEquipmentById(equipmentId)
    const updated = useEquipmentStore.getState().selectedEquipment
    if (updated && getCategorySlug(updated.category) !== params.category) {
      router.replace(`/equipment/${getCategorySlug(updated.category)}/${equipmentId}`)
    }
  }

  const handleBack = () => {
    router.push('/equipment')
  }

  if (loading && !selectedEquipment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Equipment
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!selectedEquipment) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Equipment
        </Button>
        <Alert severity="warning">Equipment not found</Alert>
      </Box>
    )
  }

  if (isEditing) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setIsEditing(false)} sx={{ mb: 3 }}>
          Cancel Edit
        </Button>
        <EquipmentForm
          equipment={selectedEquipment}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </Box>
    )
  }

  const item = selectedEquipment

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {item.name}
          </Typography>
          {item.model && (
            <Typography variant="subtitle1" color="text.secondary">
              {item.model}
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Main content */}
        <Box sx={{ flex: 1 }}>
          {/* Images */}
          {item.images && item.images.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <ImageList cols={item.images.length === 1 ? 1 : 2} gap={16}>
                  {item.images.map((img, idx) => (
                    <ImageListItem key={idx}>
                      <Box
                        component="img"
                        src={getImageUrl(img)}
                        alt={`${item.name} image ${idx + 1}`}
                        sx={{
                          width: '100%',
                          maxHeight: 400,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {item.description || 'No description available.'}
              </Typography>
            </CardContent>
          </Card>

          {/* Specifications */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Specifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(item.metadata as Record<string, unknown>).map(([key, value]) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {String(value)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Maintainers */}
          {item.maintainers && item.maintainers.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Maintainers
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {item.maintainers.map((m) => (
                    <Chip key={m.id} label={m.name} variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <DocumentList
                equipmentId={equipmentId}
                canManage={canManageDocuments}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 320 } }}>
          <Paper sx={{ p: 3 }}>
            {/* Category and Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              {item.category && categoryIcons[item.category] && (
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: alpha('#1A73E8', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}
                >
                  {categoryIcons[item.category]}
                </Box>
              )}
              <Box>
                {item.category && (
                  <Typography variant="body2" color="text.secondary">
                    {item.category}
                  </Typography>
                )}
                {item.status && (
                  <Chip
                    label={item.status.replace('_', ' ')}
                    color={statusColors[item.status] ?? 'default'}
                    size="small"
                    sx={{ mt: 0.5, textTransform: 'capitalize' }}
                  />
                )}
              </Box>
            </Box>

            {/* Your Induction Status */}
            {item.induction_required && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Your Induction Status
                </Typography>
                {isInducted ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                    <CheckCircleIcon />
                    <Typography variant="body2" fontWeight={500}>
                      You are inducted on this equipment
                    </Typography>
                  </Box>
                ) : hasPendingRequest ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                    <HourglassEmptyIcon />
                    <Typography variant="body2" fontWeight={500}>
                      Request pending
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleRequestInduction}
                    disabled={requestingInduction || inductionLoading}
                  >
                    {requestingInduction ? 'Submitting...' : 'Request Induction'}
                  </Button>
                )}
              </>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Requirements */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Requirements
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Induction required
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={item.induction_required ? 'Yes' : 'No'}
                    size="small"
                    color={item.induction_required ? 'primary' : 'default'}
                    variant={item.induction_required ? 'filled' : 'outlined'}
                  />
                  {item.induction_required && isInducted && (
                    <Chip
                      label="Approved"
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Booking required
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={item.require_booking ? 'Yes' : 'No'}
                    size="small"
                    color={item.require_booking ? 'secondary' : 'default'}
                    variant={item.require_booking ? 'filled' : 'outlined'}
                  />
                  {item.require_booking && hasUpcomingBooking && (
                    <Chip
                      label="Booked"
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Risk Level */}
            {item.risk_level && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Risk Level
                </Typography>
                <Chip
                  label={item.risk_level}
                  color={
                    item.risk_level === 'High'
                      ? 'error'
                      : item.risk_level === 'Medium'
                        ? 'warning'
                        : 'success'
                  }
                  variant="outlined"
                />
              </>
            )}

            {/* Usage */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Usage
            </Typography>
            {usageSummary && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {usageSummary.sessionsThisMonth}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This month
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {usageSummary.totalSessions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    All time
                  </Typography>
                </Box>
              </Box>
            )}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={() => setUsageDialogOpen(true)}
            >
              Log Usage
            </Button>

            {/* Actions */}
            {item.require_booking && item.status === 'operational' && (
              <>
                <Divider sx={{ my: 2 }} />
                {item.induction_required && !isInducted ? (
                  <Button variant="contained" fullWidth disabled>
                    Induction Required to Book
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setBookingDialogOpen(true)}
                  >
                    Book This Equipment
                  </Button>
                )}
              </>
            )}

            {/* User's Bookings for this equipment */}
            {myBookings.filter((b) => b.equipment_id === equipmentId && new Date(b.end_time) >= new Date()).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Your Bookings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {myBookings
                    .filter((b) => b.equipment_id === equipmentId && new Date(b.end_time) >= new Date())
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map((booking) => {
                      const startDate = new Date(booking.start_time)
                      const endDate = new Date(booking.end_time)

                      return (
                        <Box
                          key={booking.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: 'action.hover',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {startDate.toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {startDate.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {endDate.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={async () => {
                              if (confirm('Cancel this booking?')) {
                                await deleteBooking(booking.id)
                                fetchMyBookings()
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )
                    })}
                </Box>
              </>
            )}

          </Paper>
        </Box>
      </Box>

      {/* Log Usage Dialog */}
      <Dialog
        open={usageDialogOpen}
        onClose={() => setUsageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Log Equipment Usage</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Record that you used {item.name}.
          </Typography>
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={usageDuration}
            onChange={(e) => setUsageDuration(e.target.value)}
            placeholder="e.g. 30"
            helperText="Optional"
            sx={{ mb: 2 }}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={usageNotes}
            onChange={(e) => setUsageNotes(e.target.value)}
            placeholder="What did you work on?"
            multiline
            rows={2}
            helperText="Optional"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsageDialogOpen(false)} disabled={loggingUsage}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLogUsage}
            disabled={loggingUsage}
          >
            {loggingUsage ? 'Logging...' : 'Log Usage'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false)
          fetchMyBookings() // Refresh to update "Booked" pill
        }}
        selectedDate={null}
        preselectedEquipment={item}
      />
    </Box>
  )
}
