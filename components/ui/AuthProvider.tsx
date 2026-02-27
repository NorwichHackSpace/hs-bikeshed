'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/stores'
import { useProfile, useUserRoles } from '@/lib/queries'
import { isProfileComplete } from '@/lib/profileValidation'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const initialize = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setRoles = useAuthStore((state) => state.setRoles)
  const [authInitialized, setAuthInitialized] = useState(false)
  const initStarted = useRef(false)

  // Phase 1: Initialize auth session (Supabase session check)
  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true
    initialize().then(() => setAuthInitialized(true))
  }, [initialize])

  // Phase 2: Fetch profile and roles via TanStack Query (automatic retries)
  const {
    data: profile,
    isLoading: profileLoading,
  } = useProfile(authInitialized ? user?.id : undefined)

  const {
    data: roles,
    isLoading: rolesLoading,
  } = useUserRoles(authInitialized ? user?.id : undefined)

  // Sync query results back to Zustand store for backward compatibility
  useEffect(() => {
    setProfile(profile ?? null)
  }, [profile, setProfile])

  useEffect(() => {
    setRoles(roles ?? [])
  }, [roles, setRoles])

  // Phase 3: Handle redirects
  useEffect(() => {
    if (!authInitialized) return
    if (!user) return

    // Wait for queries to finish
    if (profileLoading || rolesLoading) return

    if (profile && !isProfileComplete(profile)) {
      router.push('/complete-profile')
      return
    }

    if (!roles || roles.length === 0) {
      router.push('/pending-approval')
    }
  }, [authInitialized, user, profile, profileLoading, roles, rolesLoading, router])

  const isLoading = !authInitialized || (user && (profileLoading || rolesLoading))
  const needsRedirect = user && (
    (profile && !isProfileComplete(profile)) ||
    (!rolesLoading && (!roles || roles.length === 0))
  )

  if (isLoading || needsRedirect) {
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
