'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '@/stores'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize)
  const [initialized, setInitialized] = useState(false)
  const initStarted = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React 18 Strict Mode
    if (initStarted.current) return
    initStarted.current = true

    initialize().then(() => setInitialized(true))
  }, [initialize])

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

  return <>{children}</>
}
