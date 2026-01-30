'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Alert } from '@mui/material'
import { useAuthStore } from '@/stores'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, roles, loading } = useAuthStore()
  const isAdmin = roles.includes('administrator')

  useEffect(() => {
    // Wait for auth to initialize before redirecting
    if (!loading && profile && !isAdmin) {
      router.push('/equipment')
    }
  }, [loading, profile, isAdmin, router])

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAdmin) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        You do not have permission to access this page.
      </Alert>
    )
  }

  return <>{children}</>
}
