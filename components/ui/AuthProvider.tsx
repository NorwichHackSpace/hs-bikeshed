'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/stores'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const initialize = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const roles = useAuthStore((state) => state.roles)
  const [initialized, setInitialized] = useState(false)
  const initStarted = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React 18 Strict Mode
    if (initStarted.current) return
    initStarted.current = true

    initialize().then(() => setInitialized(true))
  }, [initialize])

  useEffect(() => {
    if (!initialized) return

    // If user is authenticated but has no roles, redirect to pending approval
    if (user && roles.length === 0) {
      router.push('/pending-approval')
    }
  }, [initialized, user, roles, router])

  // Only show loading during initial auth check, not during other operations
  if (!initialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // If user has no roles, show loading while redirecting
  if (user && roles.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}
