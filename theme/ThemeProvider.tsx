'use client'

import { useMemo, useEffect, useState } from 'react'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from './theme'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering theme after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  // Use dark theme as default during SSR to prevent flash
  const ssrTheme = useMemo(() => createAppTheme('dark'), [])

  return (
    <MUIThemeProvider theme={mounted ? theme : ssrTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
