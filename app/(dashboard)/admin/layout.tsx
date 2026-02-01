'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@mui/material'
import { useAuthStore } from '@/stores'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, roles } = useAuthStore()
  const isAdmin = roles.includes('administrator')

  useEffect(() => {
    // Redirect non-admins - profile will be set by AuthProvider before this renders
    if (profile && !isAdmin) {
      router.push('/equipment')
    }
  }, [profile, isAdmin, router])

  // AuthProvider already shows loading during initialization
  // Once we're here, profile should be loaded
  if (!profile) {
    // Brief state during hydration - don't show spinner, AuthProvider handles it
    return null
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
