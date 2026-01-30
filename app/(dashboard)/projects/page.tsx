'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PublicIcon from '@mui/icons-material/Public'
import GroupIcon from '@mui/icons-material/Group'
import LockIcon from '@mui/icons-material/Lock'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Project, Profile } from '@/types/database'
import { ProjectDialog } from '@/components/features/ProjectDialog'

interface ProjectWithAuthor extends Project {
  profiles: Profile | null
  update_count?: number
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

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')

  const fetchProjects = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles (*)
        `)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError
      setProjects(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async (data: Partial<Project>) => {
    const supabase = getClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('projects')
        .insert({
          ...data,
          user_id: user.id,
        } as Project)

      if (error) throw error
      await fetchProjects()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesVisibility = visibilityFilter === 'all' || project.visibility === visibilityFilter

    return matchesSearch && matchesStatus && matchesVisibility
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share what you&apos;re working on with the hackspace community
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search projects..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Visibility</InputLabel>
          <Select
            value={visibilityFilter}
            label="Visibility"
            onChange={(e) => setVisibilityFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="hackspace">Members Only</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Projects Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={160} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {projects.length === 0
                ? "Be the first to share a project with the community!"
                : "Try adjusting your filters"}
            </Typography>
            {projects.length === 0 && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {project.cover_image_url ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={project.cover_image_url}
                    alt={project.title}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 160,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="h2"
                      sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
                    >
                      {project.title.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
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
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {project.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {project.description || 'No description'}
                  </Typography>
                  {project.tags && project.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {project.tags.length > 3 && (
                        <Chip
                          label={`+${project.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 2,
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.75rem',
                          background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
                        }}
                      >
                        {project.profiles?.name?.charAt(0).toUpperCase() ?? '?'}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {project.profiles?.name ?? 'Unknown'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(project.updated_at)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleCreateProject}
      />
    </Box>
  )
}
