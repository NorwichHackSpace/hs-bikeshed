'use client'

import { useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import { useInductionStore } from '@/stores'

export default function InductionsPage() {
  const { myInductions, myRequests, loading, initialized, error, fetchMyInductions, fetchMyRequests } =
    useInductionStore()

  useEffect(() => {
    fetchMyInductions()
    fetchMyRequests()
  }, [fetchMyInductions, fetchMyRequests])

  if (!initialized && loading) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const pendingRequests = myRequests.filter((r) => r.status === 'pending')

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Inductions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View your completed inductions and pending requests.
      </Typography>

      {pendingRequests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Requests
            </Typography>
            <List disablePadding>
              {pendingRequests.map((request, index) => (
                <Box key={request.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      <PendingIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={request.equipment?.name ?? 'Unknown equipment'}
                      secondary={`Requested ${formatDate(request.requested_at)}`}
                    />
                    <Chip label="Pending" color="warning" size="small" />
                  </ListItem>
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {myInductions.length === 0 && pendingRequests.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No inductions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Request an induction from the Equipment page to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        myInductions.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Inductions
              </Typography>
              <List disablePadding>
                {myInductions.map((induction, index) => (
                  <Box key={induction.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={induction.equipment?.name ?? 'Unknown equipment'}
                        secondary={`Inducted by ${induction.inducted_by_profile?.name ?? 'Unknown'} on ${formatDate(induction.inducted_at)}`}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        )
      )}
    </Box>
  )
}
