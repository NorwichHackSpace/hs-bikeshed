'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Button,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { useAuthStore, useMaintainerStore } from '@/stores'
import { getCategorySlug } from '@/lib/utils'

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  operational: 'success',
  out_of_service: 'warning',
  retired: 'error',
}

export default function MaintainersPage() {
  const router = useRouter()
  const { isAdmin, isMaintainer } = useAuthStore()
  const {
    maintainedEquipment,
    pendingRequests,
    loading,
    error,
    fetchMaintainedEquipment,
    fetchPendingRequests,
    approveRequest,
    rejectRequest,
  } = useMaintainerStore()

  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [approveNotes, setApproveNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const canAccess = isAdmin() || isMaintainer()

  useEffect(() => {
    if (canAccess) {
      fetchMaintainedEquipment()
      fetchPendingRequests()
    }
  }, [canAccess, fetchMaintainedEquipment, fetchPendingRequests])

  const handleEquipmentClick = (equipmentId: string, category: string | null) => {
    const categorySlug = getCategorySlug(category)
    router.push(`/equipment/${categorySlug}/${equipmentId}`)
  }

  const handleApproveClick = (requestId: string) => {
    setSelectedRequest(requestId)
    setApproveNotes('')
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return
    setActionLoading(true)
    try {
      await approveRequest(selectedRequest, approveNotes || undefined)
      setApproveDialogOpen(false)
      setSelectedRequest(null)
    } catch {
      // Error is handled by the store
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this induction request?')) return
    setActionLoading(true)
    try {
      await rejectRequest(requestId)
    } catch {
      // Error is handled by the store
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!canAccess) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ maxWidth: 500, mx: 'auto' }}>
          You need to be an administrator or equipment maintainer to access this area.
        </Alert>
      </Box>
    )
  }

  if (loading && maintainedEquipment.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Maintainer Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage equipment you maintain and approve induction requests.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Pending Induction Requests */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Pending Induction Requests
          {pendingRequests.length > 0 && (
            <Chip
              label={pendingRequests.length}
              color="warning"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Typography>

        {pendingRequests.length === 0 ? (
          <Card sx={{ bgcolor: alpha('#4caf50', 0.05), border: '1px solid', borderColor: alpha('#4caf50', 0.2) }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No pending requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All induction requests have been processed.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {pendingRequests.map((request) => (
              <Grid size={{ xs: 12, md: 6 }} key={request.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)', color: '#000',
                          fontWeight: 600,
                        }}
                      >
                        {request.profile?.name?.charAt(0).toUpperCase() ?? '?'}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={600} noWrap>
                          {request.profile?.name ?? 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {request.profile?.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <BuildIcon sx={{ fontSize: 14 }} /> Equipment
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {request.equipment?.name}
                        {request.equipment?.model && (
                          <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                            ({request.equipment.model})
                          </Typography>
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14 }} /> Requested
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(request.requested_at)}
                      </Typography>
                    </Box>

                    {request.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notes from member
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          &quot;{request.notes}&quot;
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApproveClick(request.id)}
                        disabled={actionLoading}
                        sx={{ flexGrow: 1 }}
                      >
                        Approve
                      </Button>
                      <Tooltip title="Reject request">
                        <IconButton
                          color="error"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading}
                          sx={{ border: 1, borderColor: 'error.main' }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Your Equipment */}
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Your Equipment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Equipment you are responsible for maintaining.
        </Typography>

        {maintainedEquipment.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No equipment assigned
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven&apos;t been assigned as a maintainer for any equipment yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {maintainedEquipment.map((equipment) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={equipment.id}>
                <Card
                  onClick={() => handleEquipmentClick(equipment.id, equipment.category)}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {equipment.name}
                        </Typography>
                        {equipment.model && (
                          <Typography variant="body2" color="text.secondary">
                            {equipment.model}
                          </Typography>
                        )}
                      </Box>
                      {equipment.pendingRequestCount > 0 && (
                        <Badge
                          badgeContent={equipment.pendingRequestCount}
                          color="warning"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontWeight: 600,
                            },
                          }}
                        >
                          <PersonIcon color="action" />
                        </Badge>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {equipment.category && (
                        <Chip label={equipment.category} size="small" variant="outlined" />
                      )}
                      {equipment.status && (
                        <Chip
                          label={equipment.status.replace('_', ' ')}
                          color={statusColors[equipment.status] ?? 'default'}
                          size="small"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Induction Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will mark the member as inducted on this equipment, allowing them to book it.
          </Typography>
          <TextField
            label="Notes (optional)"
            placeholder="Any notes about the induction..."
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Approving...' : 'Approve Induction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
