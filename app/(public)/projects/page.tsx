import { Box, Card, CardContent, CardMedia, Chip, Container, Grid, Typography, alpha } from '@mui/material'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  on_hold: 'warning',
  archived: 'default',
}

export default async function PublicProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, status, cover_image_url, created_at, profiles(name)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path
    return `${SUPABASE_URL}/storage/v1/object/public/project-images/${path}`
  }

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${alpha('#F9B233', 0.08)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography variant="overline" sx={{ color: 'secondary.main', mb: 2, display: 'block' }}>
            Projects
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 3 }}>
            What People Are Making
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}
          >
            A showcase of public projects from our members. See what&apos;s possible
            when you have access to the right tools and community.
          </Typography>
        </Container>
      </Box>

      {/* Projects grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, pb: { xs: 8, md: 12 } }}>
        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No public projects yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Members can set their projects to public visibility to share them here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 200ms ease-in-out',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  {project.cover_image_url && (
                    <CardMedia
                      component="img"
                      height="180"
                      image={getImageUrl(project.cover_image_url)}
                      alt={project.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {project.status && (
                        <Chip
                          label={project.status.replace('_', ' ')}
                          size="small"
                          color={statusColors[project.status] || 'default'}
                        />
                      )}
                    </Box>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                      {project.title}
                    </Typography>
                    {project.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          flexGrow: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.6,
                        }}
                      >
                        {project.description}
                      </Typography>
                    )}
                    {project.profiles && (
                      <Typography variant="caption" color="text.secondary">
                        by {(project.profiles as { name: string }).name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  )
}
