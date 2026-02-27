'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore, useAppStore } from '@/stores'
import { isProfileComplete } from '@/lib/profileValidation'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const initialize = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const roles = useAuthStore((state) => state.roles)
  const initializeApp = useAppStore((state) => state.initializeApp)
  const appInitialized = useAppStore((state) => state.initialized)
  const [authInitialized, setAuthInitialized] = useState(false)
  const initStarted = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React 18 Strict Mode
    if (initStarted.current) return
    initStarted.current = true

    initialize().then(() => setAuthInitialized(true))
  }, [initialize])

  // Initialize app data after auth is ready and user has roles
  useEffect(() => {
    if (authInitialized && user && roles.length > 0 && !appInitialized) {
      initializeApp()
    }
  }, [authInitialized, user, roles, appInitialized, initializeApp])

  useEffect(() => {
    if (!authInitialized) return

    // If user is authenticated but profile is incomplete, redirect to complete profile
    if (user && profile && !isProfileComplete(profile)) {
      router.push('/complete-profile')
      return
    }

    // If user is authenticated but has no roles, redirect to pending approval
    if (user && roles.length === 0) {
      router.push('/pending-approval')
    }
  }, [authInitialized, user, profile, roles, router])

  // Show loading during initial auth check
  if (!authInitialized) {
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

  // If user has incomplete profile or no roles, show loading while redirecting
  if (user && ((profile && !isProfileComplete(profile)) || roles.length === 0)) {
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
