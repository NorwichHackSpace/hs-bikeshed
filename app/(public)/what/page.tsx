'use client'

import { Box, Container, Typography, Grid, Card, CardContent, alpha } from '@mui/material'
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing'
import Diversity3Icon from '@mui/icons-material/Diversity3'
import SchoolIcon from '@mui/icons-material/School'
import HandymanIcon from '@mui/icons-material/Handyman'

export default function WhatPage() {
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
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? `radial-gradient(ellipse at 50% 0%, ${alpha('#F9B233', 0.06)} 0%, transparent 60%)`
                : `radial-gradient(ellipse at 50% 0%, ${alpha('#F9B233', 0.1)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography variant="overline" sx={{ color: 'secondary.main', mb: 2, display: 'block' }}>
            What
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 3 }}>
            What is a Hackspace?
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.7 }}
          >
            A hackspace is a community-run workshop where people come together to make,
            learn, and share. Think of it as a shared garage, studio, and lab rolled into one.
          </Typography>
        </Container>
      </Box>

      {/* Details */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={4}>
          {[
            {
              icon: <PrecisionManufacturingIcon sx={{ fontSize: 36 }} />,
              title: 'Shared Workshop',
              description:
                'Access equipment you wouldn\'t normally have at home: laser cutters, 3D printers, CNC machines, lathes, sewing machines, soldering stations, and a full woodworking shop.',
            },
            {
              icon: <Diversity3Icon sx={{ fontSize: 36 }} />,
              title: 'Community of Makers',
              description:
                'Our members include software developers, artists, engineers, crafters, students, and hobbyists. Whatever your background, you\'ll find people who share your interests.',
            },
            {
              icon: <SchoolIcon sx={{ fontSize: 36 }} />,
              title: 'Learning & Skills',
              description:
                'Equipment inductions ensure everyone can use tools safely. Members regularly share knowledge through informal sessions and one-to-one help.',
            },
            {
              icon: <HandymanIcon sx={{ fontSize: 36 }} />,
              title: 'Open to All',
              description:
                'No experience required. Whether you\'re a complete beginner or a seasoned maker, the hackspace is a place for everyone to explore, create, and experiment.',
            },
          ].map((item) => (
            <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'secondary.main',
                      backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  )
}
