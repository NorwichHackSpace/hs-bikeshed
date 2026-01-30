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
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Booking, Equipment, Profile } from '@/types/database'

interface BookingWithDetails extends Booking {
  equipment: Equipment | null
  profiles: Profile | null
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBooking, setDeletingBooking] = useState<BookingWithDetails | null>(null)

  const fetchBookings = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          equipment (*),
          profiles (*)
        `)
        .order('start_time', { ascending: false })

      if (fetchError) throw fetchError
      setBookings(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleDeleteClick = (booking: BookingWithDetails) => {
    setDeletingBooking(booking)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return

    const supabase = getClient()
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', deletingBooking.id)
      if (error) throw error
      await fetchBookings()
      setDeleteDialogOpen(false)
      setDeletingBooking(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const columns: GridColDef[] = [
    {
      field: 'profiles',
      headerName: 'User',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<BookingWithDetails>) => (
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
      renderCell: (params: GridRenderCellParams<BookingWithDetails>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.equipment?.name ?? 'Unknown'}
          </Typography>
          {params.row.equipment?.model && (
            <Typography variant="caption" color="text.secondary">
              {params.row.equipment.model}
            </Typography>
          )}
        </Box>
      ),
      valueGetter: (_value, row) => row.equipment?.name ?? '',
    },
    {
      field: 'start_time',
      headerName: 'Date',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(params.row.start_time)} - {formatTime(params.row.end_time)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<BookingWithDetails>) => {
        const upcoming = isUpcoming(params.row.start_time)
        return (
          <Chip
            label={upcoming ? 'Upcoming' : 'Past'}
            color={upcoming ? 'primary' : 'default'}
            size="small"
            variant={upcoming ? 'filled' : 'outlined'}
          />
        )
      },
      valueGetter: (_value, row) => (isUpcoming(row.start_time) ? 'Upcoming' : 'Past'),
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
      field: 'created_at',
      headerName: 'Booked On',
      width: 140,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? formatDateTime(params.value) : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<BookingWithDetails>) => (
        <IconButton
          size="small"
          onClick={() => handleDeleteClick(params.row)}
          color="error"
          title="Delete booking"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/admin')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Bookings Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all equipment bookings
          </Typography>
        </Box>
        <Chip
          label={`${bookings.filter((b) => isUpcoming(b.start_time)).length} upcoming`}
          color="primary"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={bookings}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'start_time', sort: 'desc' }] },
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
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this booking?
          </Typography>
          {deletingBooking && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>User:</strong> {deletingBooking.profiles?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Equipment:</strong> {deletingBooking.equipment?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDateTime(deletingBooking.start_time)}
              </Typography>
            </Box>
          )}
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
