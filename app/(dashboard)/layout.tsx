'use client'

import { Box, Toolbar } from '@mui/material'
import { Navigation } from '@/components/ui/Navigation'
import { AuthProvider } from '@/components/ui/AuthProvider'

const DRAWER_WIDTH = 280

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </AuthProvider>
  )
}
