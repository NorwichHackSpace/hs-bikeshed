'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Custom components for MUI styling
const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mt: 4, mb: 2 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <>
      <Divider sx={{ my: 4 }} />
      <Typography variant="h4" fontWeight={600} gutterBottom sx={{ mt: 4, mb: 2 }}>
        {children}
      </Typography>
    </>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3, mb: 1.5 }}>
      {children}
    </Typography>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, mb: 1 }}>
      {children}
    </Typography>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
      {children}
    </Typography>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ul" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.7 }}>
      {children}
    </Typography>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <Box
      sx={{
        borderLeft: 4,
        borderColor: 'primary.main',
        pl: 2,
        py: 1,
        my: 2,
        bgcolor: 'action.hover',
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className
    if (isInline) {
      return (
        <Box
          component="code"
          sx={{
            backgroundColor: 'action.hover',
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.875em',
          }}
        >
          {children}
        </Box>
      )
    }
    return (
      <Box
        component="pre"
        sx={{
          backgroundColor: '#1a1f37',
          color: '#e0e0e0',
          p: 2,
          borderRadius: 2,
          overflow: 'auto',
          mb: 2,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        <code>{children}</code>
      </Box>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <Box sx={{ overflowX: 'auto', mb: 2 }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th, & td': {
            border: 1,
            borderColor: 'divider',
            p: 1.5,
            textAlign: 'left',
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 600,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  ),
  hr: () => <Divider sx={{ my: 4 }} />,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: 'primary.main',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      }}
    >
      {children}
    </Box>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <Box component="strong" sx={{ fontWeight: 600 }}>
      {children}
    </Box>
  ),
}

export default function DesignPage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch('/api/design-doc')
        if (!response.ok) {
          throw new Error('Failed to load design document')
        }
        const text = await response.text()
        setContent(text)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Design Specification
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System design and feature documentation for BikeShed.
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </Paper>
    </Box>
  )
}
