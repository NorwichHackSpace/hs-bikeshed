'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  TextField,
  Alert,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PublicIcon from '@mui/icons-material/Public'
import GroupIcon from '@mui/icons-material/Group'
import LockIcon from '@mui/icons-material/Lock'
import SendIcon from '@mui/icons-material/Send'
import { useRouter, useParams } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import type { Project, ProjectUpdate, Profile } from '@/types/database'
import { ProjectDialog } from '@/components/features/ProjectDialog'
import { ImageUpload } from '@/components/features/ImageUpload'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

interface ProjectWithAuthor extends Project {
  profiles: Profile | null
}

interface UpdateWithAuthor extends ProjectUpdate {
  profiles: Profile | null
}

const visibilityIcons = {
  public: <PublicIcon fontSize="small" />,
  hackspace: <GroupIcon fontSize="small" />,
  private: <LockIcon fontSize="small" />,
}

const visibilityLabels = {
  public: 'Public',
  hackspace: 'Members Only',
  private: 'Private',
}

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  on_hold: 'warning',
  archived: 'default',
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { profile } = useAuthStore()

  const [project, setProject] = useState<ProjectWithAuthor | null>(null)
  const [updates, setUpdates] = useState<UpdateWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  // New update form
  const [newUpdateTitle, setNewUpdateTitle] = useState('')
  const [newUpdateContent, setNewUpdateContent] = useState('')
  const [newUpdateImages, setNewUpdateImages] = useState<string[]>([])
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

  // Helper to get full image URL
  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path
    return `${SUPABASE_URL}/storage/v1/object/public/project-images/${path}`
  }

  const isOwner = profile?.id === project?.user_id

  const fetchProject = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (*)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      const { data: updatesData, error: updatesError } = await supabase
        .from('project_updates')
        .select(`
          *,
          profiles (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (updatesError) throw updatesError
      setUpdates(updatesData || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleEditProject = async (data: Partial<Project>) => {
    const supabase = getClient()

    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', projectId)

      if (error) throw error
      await fetchProject()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDeleteProject = async () => {
    const supabase = getClient()

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      router.push('/projects')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handlePostUpdate = async () => {
    if (!newUpdateContent.trim()) return

    const supabase = getClient()
    setSubmittingUpdate(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('project_updates')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: newUpdateTitle.trim() || null,
          content: newUpdateContent.trim(),
          images: newUpdateImages,
        })

      if (error) throw error

      setNewUpdateTitle('')
      setNewUpdateContent('')
      setNewUpdateImages([])
      await fetchProject()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const handleDeleteUpdate = async (updateId: string) => {
    const supabase = getClient()

    try {
      const { error } = await supabase
        .from('project_updates')
        .delete()
        .eq('id', updateId)

      if (error) throw error
      await fetchProject()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  if (!project) {
    return (
      <Box>
        <Alert severity="error">Project not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/projects')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              size="small"
              label={project.status.replace('_', ' ')}
              color={statusColors[project.status]}
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              size="small"
              icon={visibilityIcons[project.visibility]}
              label={visibilityLabels[project.visibility]}
              variant="outlined"
            />
          </Box>
          <Typography variant="h4" fontWeight={700}>
            {project.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)', color: '#000',
              }}
            >
              {project.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {project.profiles?.name ?? 'Unknown'} &bull; Started {formatDate(project.created_at)}
            </Typography>
          </Box>
        </Box>
        {isOwner && (
          <>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  setEditDialogOpen(true)
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Project</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  setDeleteDialogOpen(true)
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete Project</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Project Details */}
      <Card sx={{ mb: 4 }}>
        {project.cover_image_url && (
          <Box
            component="img"
            src={project.cover_image_url}
            alt={project.title}
            sx={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
            }}
          />
        )}
        <CardContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {project.description || 'No description provided.'}
          </Typography>
          {project.tags && project.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {project.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Updates Section */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Updates ({updates.length})
      </Typography>

      {/* Post Update Form (only for owner) */}
      {isOwner && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Post an Update
            </Typography>
            <TextField
              placeholder="Update title (optional)"
              fullWidth
              size="small"
              value={newUpdateTitle}
              onChange={(e) => setNewUpdateTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              placeholder="Share your progress, what you've learned, or what's next..."
              fullWidth
              multiline
              rows={3}
              value={newUpdateContent}
              onChange={(e) => setNewUpdateContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <ImageUpload
                images={newUpdateImages}
                onChange={setNewUpdateImages}
                bucket="project-images"
                entityId={projectId}
                label="Attach Images"
                maxImages={5}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handlePostUpdate}
                disabled={!newUpdateContent.trim() || submittingUpdate}
              >
                Post Update
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Updates List */}
      {updates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No updates yet.
              {isOwner && ' Share your progress with the community!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {updates.map((update, index) => (
            <Card key={update.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)', color: '#000',
                      }}
                    >
                      {update.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {update.profiles?.name ?? 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(update.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  {isOwner && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUpdate(update.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {update.title && (
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    {update.title}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {update.content}
                </Typography>
                {update.images && update.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    {update.images.map((img, imgIndex) => (
                      <Box
                        key={imgIndex}
                        component="img"
                        src={getImageUrl(img)}
                        alt={`Update image ${imgIndex + 1}`}
                        sx={{
                          width: 150,
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.9,
                          },
                        }}
                        onClick={() => window.open(getImageUrl(img), '_blank')}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
              {index < updates.length - 1 && <Divider />}
            </Card>
          ))}
        </Box>
      )}

      {/* Edit Dialog */}
      <ProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditProject}
        project={project}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{project.title}&quot;? This will also delete all
            updates. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
