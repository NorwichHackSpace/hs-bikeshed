'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  TextField,
  Typography,
  Alert,
  alpha,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import HomeIcon from '@mui/icons-material/Home'
import { useAuthStore } from '@/stores'

export default function LoginPage() {
  const router = useRouter()
  const { signInWithEmail, signInWithGoogle, loading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signInWithEmail(email, password)
      router.push('/equipment')
    } catch {
      // Error is handled by store
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch {
      // Error is handled by store
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f37 0%, #0f1225 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(26, 115, 232, 0.3)',
            }}
          >
            <HomeIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
            BikeShed
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.7) }}>
            Norwich Hackspace Member Portal
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to access your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{
                mb: 3,
                py: 1.5,
                borderColor: alpha('#000000', 0.15),
                color: 'text.primary',
                '&:hover': {
                  borderColor: alpha('#000000', 0.3),
                  backgroundColor: alpha('#000000', 0.02),
                },
              }}
            >
              Continue with Google
            </Button>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Box component="form" onSubmit={handleEmailLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                style={{
                  color: '#1A73E8',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign up
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
