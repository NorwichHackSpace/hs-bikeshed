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
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PublicIcon from '@mui/icons-material/Public'
import GroupIcon from '@mui/icons-material/Group'
import LockIcon from '@mui/icons-material/Lock'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Project, Profile } from '@/types/database'
import { ProjectDialog } from '@/components/features/ProjectDialog'

interface ProjectWithAuthor extends Project {
  profiles: Profile | null
  update_count: number
}

const visibilityIcons: Record<string, React.ReactNode> = {
  public: <PublicIcon fontSize="small" />,
  hackspace: <GroupIcon fontSize="small" />,
  private: <LockIcon fontSize="small" />,
}

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  on_hold: 'warning',
  archived: 'default',
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<ProjectWithAuthor | null>(null)

  const fetchProjects = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      // Fetch all projects (admin can see everything)
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Fetch update counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const { count } = await supabase
            .from('project_updates')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)

          return {
            ...project,
            update_count: count || 0,
          }
        })
      )

      setProjects(projectsWithCounts)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setEditDialogOpen(true)
  }

  const handleSave = async (data: Partial<Project>) => {
    if (!editingProject) return

    const supabase = getClient()

    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', editingProject.id)

      if (error) throw error
      await fetchProjects()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDeleteClick = (project: ProjectWithAuthor) => {
    setDeletingProject(project)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return

    const supabase = getClient()

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deletingProject.id)

      if (error) throw error
      await fetchProjects()
      setDeleteDialogOpen(false)
      setDeletingProject(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.title}
          </Typography>
          {params.row.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                maxWidth: 250,
              }}
            >
              {params.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'profiles',
      headerName: 'Author',
      width: 180,
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
            }}
          >
            {params.row.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
          </Avatar>
          <Typography variant="body2">
            {params.row.profiles?.name ?? 'Unknown'}
          </Typography>
        </Box>
      ),
      valueGetter: (_value, row) => row.profiles?.name ?? '',
    },
    {
      field: 'visibility',
      headerName: 'Visibility',
      width: 130,
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Chip
          size="small"
          icon={visibilityIcons[params.row.visibility] as React.ReactElement}
          label={params.row.visibility}
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Chip
          size="small"
          label={params.row.status.replace('_', ' ')}
          color={statusColors[params.row.status]}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'update_count',
      headerName: 'Updates',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Chip size="small" label={params.row.update_count} variant="outlined" />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      width: 120,
      renderCell: (params: GridRenderCellParams) => formatDateTime(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ProjectWithAuthor>) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => router.push(`/projects/${params.row.id}`)}
            title="View project"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            title="Edit project"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            color="error"
            title="Delete project"
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
            Projects Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all member projects and updates
          </Typography>
        </Box>
        <Chip label={`${projects.length} projects`} color="primary" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={projects}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
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

      {/* Edit Dialog */}
      <ProjectDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setEditingProject(null)
        }}
        onSave={handleSave}
        project={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deletingProject?.title}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will also delete {deletingProject?.update_count || 0} update(s). This action cannot
            be undone.
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
