'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  alpha,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import BuildIcon from '@mui/icons-material/Build'
import SchoolIcon from '@mui/icons-material/School'
import EventIcon from '@mui/icons-material/Event'
import FolderIcon from '@mui/icons-material/Folder'

const adminSections = [
  {
    title: 'Users',
    description: 'Manage members, roles, and permissions',
    icon: <PeopleIcon sx={{ fontSize: 48 }} />,
    href: '/admin/users',
    color: '#7928CA',
  },
  {
    title: 'Equipment',
    description: 'Add, edit, and manage equipment',
    icon: <BuildIcon sx={{ fontSize: 48 }} />,
    href: '/admin/equipment',
    color: '#1A73E8',
  },
  {
    title: 'Inductions',
    description: 'Review induction requests and records',
    icon: <SchoolIcon sx={{ fontSize: 48 }} />,
    href: '/admin/inductions',
    color: '#17AD37',
  },
  {
    title: 'Bookings',
    description: 'View and manage all bookings',
    icon: <EventIcon sx={{ fontSize: 48 }} />,
    href: '/admin/bookings',
    color: '#F9B233',
  },
  {
    title: 'Projects',
    description: 'Manage member projects and updates',
    icon: <FolderIcon sx={{ fontSize: 48 }} />,
    href: '/admin/projects',
    color: '#E91E63',
  },
]

export default function AdminPage() {
  const router = useRouter()

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage users, equipment, and system settings.
      </Typography>

      <Grid container spacing={3}>
        {adminSections.map((section) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={section.title}>
            <Card
              onClick={() => router.push(section.href)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 200ms ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px ${alpha(section.color, 0.25)}`,
                },
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <Box
                  sx={{
                    color: section.color,
                    mb: 2,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: alpha(section.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {section.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
