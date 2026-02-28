import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Typography,
  alpha,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  on_hold: 'warning',
  archived: 'default',
}

function getImageUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/project-images/${path}`
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString: string | null) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PublicProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(name)')
    .eq('id', id)
    .eq('visibility', 'public')
    .single()

  if (!project) {
    notFound()
  }

  const { data: updates } = await supabase
    .from('project_updates')
    .select('*, profiles(name)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 8 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
        <Link href="/projects">
          <IconButton size="small" sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" fontWeight={700}>
              {project.title}
            </Typography>
            {project.status && (
              <Chip
                size="small"
                label={project.status.replace('_', ' ')}
                color={statusColors[project.status] || 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Avatar
              sx={{
                width: 20,
                height: 20,
                fontSize: '0.65rem',
                background: `linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)`,
                color: '#000',
              }}
            >
              {(project.profiles as { name: string })?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {(project.profiles as { name: string })?.name ?? 'Unknown'} &bull; Started{' '}
              {formatDate(project.created_at)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Project details */}
      <Card sx={{ mb: 4 }}>
        {project.cover_image_url && (
          <Box
            component="img"
            src={getImageUrl(project.cover_image_url)}
            alt={project.title}
            sx={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
            }}
          />
        )}
        <CardContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {project.description || 'No description provided.'}
          </Typography>
          {project.tags && project.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {project.tags.map((tag: string) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Updates */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Updates ({updates?.length ?? 0})
      </Typography>

      {!updates || updates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No updates yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {updates.map((update, index) => (
            <Card key={update.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      background: `linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)`,
                      color: '#000',
                    }}
                  >
                    {(update.profiles as { name: string } | null)?.name?.charAt(0).toUpperCase() ?? '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {(update.profiles as { name: string } | null)?.name ?? 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(update.created_at)}
                    </Typography>
                  </Box>
                </Box>
                {update.title && (
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    {update.title}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {update.content}
                </Typography>
                {update.images && (update.images as string[]).length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    {(update.images as string[]).map((img, imgIndex) => (
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
                        }}
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
    </Container>
  )
}
