'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Induction, InductionRequest, Equipment, Profile } from '@/types/database'

interface InductionWithDetails extends Induction {
  equipment: Equipment | null
  profiles: Profile | null
  inductor: Profile | null
}

interface InductionRequestWithDetails extends InductionRequest {
  equipment: Equipment | null
  profiles: Profile | null
}

export default function AdminInductionsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [inductions, setInductions] = useState<InductionWithDetails[]>([])
  const [requests, setRequests] = useState<InductionRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: 'induction' | 'request'; item: InductionWithDetails | InductionRequestWithDetails } | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      // Fetch completed inductions
      const { data: inductionsData, error: inductionsError } = await supabase
        .from('inductions')
        .select(`
          *,
          equipment (*),
          profiles!user_id (*),
          inductor:profiles!inducted_by (*)
        `)
        .order('inducted_at', { ascending: false })

      if (inductionsError) throw inductionsError

      // Fetch induction requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('induction_requests')
        .select(`
          *,
          equipment (*),
          profiles!user_id (*)
        `)
        .order('requested_at', { ascending: false })

      if (requestsError) throw requestsError

      setInductions(inductionsData || [])
      setRequests(requestsData || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteClick = (type: 'induction' | 'request', item: InductionWithDetails | InductionRequestWithDetails) => {
    setDeletingItem({ type, item })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return

    const supabase = getClient()
    try {
      const table = deletingItem.type === 'induction' ? 'inductions' : 'induction_requests'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deletingItem.item.id)
      if (error) throw error
      await fetchData()
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleApproveRequest = async (request: InductionRequestWithDetails) => {
    const supabase = getClient()
    try {
      // Get current user for inducted_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create induction record
      const { error: inductionError } = await supabase
        .from('inductions')
        .insert({
          equipment_id: request.equipment_id,
          user_id: request.user_id,
          inducted_by: user.id,
          inducted_at: new Date().toISOString(),
          notes: `Approved from request. Original notes: ${request.notes || 'None'}`,
        })

      if (inductionError) throw inductionError

      // Update request status
      const { error: updateError } = await supabase
        .from('induction_requests')
        .update({ status: 'approved' })
        .eq('id', request.id)

      if (updateError) throw updateError

      await fetchData()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleRejectRequest = async (request: InductionRequestWithDetails) => {
    const supabase = getClient()
    try {
      const { error } = await supabase
        .from('induction_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id)

      if (error) throw error
      await fetchData()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const inductionColumns: GridColDef[] = [
    {
      field: 'profiles',
      headerName: 'User',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<InductionWithDetails>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
            }}
          >
            {params.row.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.profiles?.name ?? 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.profiles?.email}
            </Typography>
          </Box>
        </Box>
      ),
      valueGetter: (_value, row) => row.profiles?.name ?? '',
    },
    {
      field: 'equipment',
      headerName: 'Equipment',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<InductionWithDetails>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.equipment?.name ?? 'Unknown'}
          </Typography>
          {params.row.equipment?.category && (
            <Typography variant="caption" color="text.secondary">
              {params.row.equipment.category}
            </Typography>
          )}
        </Box>
      ),
      valueGetter: (_value, row) => row.equipment?.name ?? '',
    },
    {
      field: 'inductor',
      headerName: 'Inducted By',
      width: 150,
      renderCell: (params: GridRenderCellParams<InductionWithDetails>) => (
        <Typography variant="body2">
          {params.row.inductor?.name ?? 'Unknown'}
        </Typography>
      ),
      valueGetter: (_value, row) => row.inductor?.name ?? '',
    },
    {
      field: 'inducted_at',
      headerName: 'Date',
      width: 160,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<InductionWithDetails>) => (
        <IconButton
          size="small"
          onClick={() => handleDeleteClick('induction', params.row)}
          color="error"
          title="Delete induction"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  const requestColumns: GridColDef[] = [
    {
      field: 'profiles',
      headerName: 'User',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<InductionRequestWithDetails>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
            }}
          >
            {params.row.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.profiles?.name ?? 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.profiles?.email}
            </Typography>
          </Box>
        </Box>
      ),
      valueGetter: (_value, row) => row.profiles?.name ?? '',
    },
    {
      field: 'equipment',
      headerName: 'Equipment',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<InductionRequestWithDetails>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.equipment?.name ?? 'Unknown'}
          </Typography>
          {params.row.equipment?.category && (
            <Typography variant="caption" color="text.secondary">
              {params.row.equipment.category}
            </Typography>
          )}
        </Box>
      ),
      valueGetter: (_value, row) => row.equipment?.name ?? '',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value || 'pending'
        const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error',
        }
        return (
          <Chip
            label={status}
            color={colors[status] || 'default'}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        )
      },
    },
    {
      field: 'requested_at',
      headerName: 'Requested',
      width: 160,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<InductionRequestWithDetails>) => {
        const isPending = !params.row.status || params.row.status === 'pending'
        return (
          <Box>
            {isPending && (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleApproveRequest(params.row)}
                  color="success"
                  title="Approve"
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleRejectRequest(params.row)}
                  color="error"
                  title="Reject"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
            <IconButton
              size="small"
              onClick={() => handleDeleteClick('request', params.row)}
              color="error"
              title="Delete request"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      },
    },
  ]

  const pendingCount = requests.filter((r) => !r.status || r.status === 'pending').length

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/admin')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Inductions Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage induction records and requests
          </Typography>
        </Box>
        {pendingCount > 0 && (
          <Chip
            icon={<PendingIcon />}
            label={`${pendingCount} pending`}
            color="warning"
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label={`Completed Inductions (${inductions.length})`} />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Requests ({requests.length})
                {pendingCount > 0 && (
                  <Chip label={pendingCount} size="small" color="warning" />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        {activeTab === 0 ? (
          <DataGrid
            rows={inductions}
            columns={inductionColumns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'inducted_at', sort: 'desc' }] },
            }}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                py: 1,
              },
            }}
          />
        ) : (
          <DataGrid
            rows={requests}
            columns={requestColumns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'requested_at', sort: 'desc' }] },
            }}
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                py: 1,
              },
            }}
          />
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete {deletingItem?.type === 'induction' ? 'Induction' : 'Request'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this{' '}
            {deletingItem?.type === 'induction' ? 'induction record' : 'induction request'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
