'use client'

import Link from 'next/link'
import { Box, Button, Container, Typography, Grid, Card, CardContent, alpha } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import GroupsIcon from '@mui/icons-material/Groups'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          py: { xs: 10, md: 16 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? `radial-gradient(ellipse at 50% 0%, ${alpha('#F9B233', 0.08)} 0%, transparent 60%)`
                : `radial-gradient(ellipse at 50% 0%, ${alpha('#F9B233', 0.12)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography
            variant="overline"
            sx={{
              color: 'secondary.main',
              mb: 2,
              display: 'block',
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
            }}
          >
            Norwich Hackspace
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              lineHeight: 1.15,
            }}
          >
            Make things.{' '}
            <Box
              component="span"
              sx={{ color: 'secondary.main' }}
            >
              Together.
            </Box>
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{
              maxWidth: 560,
              mx: 'auto',
              mb: 5,
              fontSize: { xs: '1rem', md: '1.15rem' },
              lineHeight: 1.7,
            }}
          >
            A community workshop in Norwich where you can access tools, learn new
            skills, and bring your ideas to life. From laser cutting to electronics,
            woodwork to 3D printing.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                },
              }}
            >
              Become a Member
            </Button>
            <Button
              component={Link}
              href="/what"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Feature cards */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <BuildIcon sx={{ fontSize: 36 }} />,
              title: 'Tools & Equipment',
              description:
                'Laser cutters, 3D printers, CNC machines, woodworking tools, electronics stations, and more.',
            },
            {
              icon: <GroupsIcon sx={{ fontSize: 36 }} />,
              title: 'Community',
              description:
                'Meet makers, share knowledge, collaborate on projects, and learn from each other.',
            },
            {
              icon: <RocketLaunchIcon sx={{ fontSize: 36 }} />,
              title: 'Your Projects',
              description:
                'A dedicated space to work on whatever you want — personal projects, prototypes, repairs, art.',
            },
          ].map((feature) => (
            <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 200ms ease-in-out',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      color: 'secondary.main',
                      backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Location */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          px: 3,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'secondary.main', mb: 1, display: 'block' }}>
            Find Us
          </Typography>
          <Typography variant="h3" gutterBottom>
            Visit the BikeShed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Norwich Hackspace (The BikeShed)
            <br />
            Unit 1, Seymour Road
            <br />
            Norwich, NR1 1RB
          </Typography>
        </Container>
      </Box>
    </>
  )
}
