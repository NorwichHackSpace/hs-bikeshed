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
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Equipment } from '@/types/database'
import { EquipmentDialog } from '@/components/features/EquipmentDialog'

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  operational: 'success',
  out_of_service: 'warning',
  retired: 'error',
}

export default function AdminEquipmentPage() {
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)

  const fetchEquipment = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('equipment')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      setEquipment(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const handleAdd = () => {
    setEditingEquipment(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item)
    setDialogOpen(true)
  }

  const handleSave = async (data: Partial<Equipment>) => {
    const supabase = getClient()

    try {
      if (editingEquipment) {
        const { error } = await supabase
          .from('equipment')
          .update(data)
          .eq('id', editingEquipment.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert(data as Equipment)
        if (error) throw error
      }
      await fetchEquipment()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDeleteClick = (item: Equipment) => {
    setDeletingEquipment(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEquipment) return

    const supabase = getClient()
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', deletingEquipment.id)
      if (error) throw error
      await fetchEquipment()
      setDeleteDialogOpen(false)
      setDeletingEquipment(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'model',
      headerName: 'Model',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          '-'
        ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip
            label={params.value.replace('_', ' ')}
            color={statusColors[params.value] || 'default'}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        ) : (
          '-'
        ),
    },
    {
      field: 'risk_level',
      headerName: 'Risk',
      width: 100,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          '-'
        ),
    },
    {
      field: 'induction_required',
      headerName: 'Induction',
      width: 100,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label="Required" size="small" color="primary" />
        ) : (
          <Chip label="No" size="small" variant="outlined" />
        ),
    },
    {
      field: 'require_booking',
      headerName: 'Booking',
      width: 100,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label="Required" size="small" color="secondary" />
        ) : (
          <Chip label="No" size="small" variant="outlined" />
        ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Equipment>) => (
        <Box>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
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
            Equipment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all hackspace equipment
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Equipment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={equipment}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
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

      <EquipmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        equipment={editingEquipment}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Equipment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deletingEquipment?.name}&quot;?
            This action cannot be undone.
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
