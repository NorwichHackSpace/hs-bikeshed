'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Button,
  alpha,
} from '@mui/material'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RefreshIcon from '@mui/icons-material/Refresh'
import LogoutIcon from '@mui/icons-material/Logout'
import { getClient } from '@/lib/supabase/client'

export default function PendingApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    const checkApproval = async () => {
      const supabase = getClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user now has roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (roles && roles.length > 0) {
        // User has been approved, redirect to equipment
        router.push('/equipment')
      }
    }

    checkApproval()
  }, [router])

  const handleRefresh = async () => {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user now has roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roles && roles.length > 0) {
      router.push('/equipment')
    } else {
      // Force page reload to show fresh state
      window.location.reload()
    }
  }

  const handleSignOut = async () => {
    const supabase = getClient()
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
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
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <HourglassEmptyIcon sx={{ color: '#000', fontSize: 40 }} />
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom>
              Membership Pending Approval
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Thank you for signing up to Norwich Hackspace! Your membership application
              is currently being reviewed by our admin team.
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Once approved, you&apos;ll have full access to the member portal including
              equipment bookings, inductions, and project spaces. We typically review
              new applications within a few days.
            </Typography>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: alpha('#F9B233', 0.1),
                border: `1px solid ${alpha('#F9B233', 0.3)}`,
                mb: 4,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>What happens next?</strong>
                <br />
                An admin will review your application and assign you the appropriate
                membership role. You&apos;ll then be able to access all hackspace features.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                fullWidth
              >
                Check Approval Status
              </Button>

              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleSignOut}
                fullWidth
              >
                Sign Out
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
