'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useUsageLogStore } from '@/stores'
import type { UsageLogWithEquipment } from '@/types/database'

export default function UsagePage() {
  const { myUsage, loading, error, fetchMyUsage, deleteUsageLog } = useUsageLogStore()
  const [filter, setFilter] = useState<'all' | 'manual' | 'booking'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchMyUsage()
  }, [fetchMyUsage])

  const filteredUsage = myUsage.filter((entry) => {
    if (filter === 'all') return true
    return entry.source === filter
  })

  // Group by month
  const groupedByMonth = filteredUsage.reduce(
    (acc, entry) => {
      const date = new Date(entry.started_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      if (!acc[key]) {
        acc[key] = { label, entries: [] }
      }
      acc[key].entries.push(entry)
      return acc
    },
    {} as Record<string, { label: string; entries: UsageLogWithEquipment[] }>
  )

  const totalSessions = filteredUsage.length
  const totalMinutes = filteredUsage.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)
  const uniqueEquipment = new Set(filteredUsage.map((e) => e.equipment_id)).size

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this usage log entry?')) return
    setDeleting(id)
    try {
      await deleteUsageLog(id)
    } finally {
      setDeleting(null)
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const sourceLabels: Record<string, string> = {
    manual: 'Manual',
    booking: 'Booking',
    check_in: 'Check-in',
  }

  const sourceColors: Record<string, 'default' | 'primary' | 'secondary'> = {
    manual: 'default',
    booking: 'primary',
    check_in: 'secondary',
  }

  if (loading && myUsage.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Usage
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your equipment usage history.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {totalSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sessions
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {formatDuration(totalMinutes)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Time
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {uniqueEquipment}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Equipment Used
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Source"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'manual' | 'booking')}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="manual">Manual</MenuItem>
          <MenuItem value="booking">Booking</MenuItem>
        </TextField>
      </Box>

      {/* Usage entries grouped by month */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No usage logged yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Log your first equipment usage from any equipment detail page.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByMonth)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([key, { label, entries }]) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {label}
              </Typography>
              <Card variant="outlined">
                {entries.map((entry, idx) => (
                  <Box
                    key={entry.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderBottom: idx < entries.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {entry.equipment?.name ?? 'Unknown Equipment'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(entry.started_at).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      {entry.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {entry.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {entry.duration_minutes && (
                        <Chip
                          label={formatDuration(entry.duration_minutes)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={sourceLabels[entry.source] ?? entry.source}
                        size="small"
                        color={sourceColors[entry.source] ?? 'default'}
                      />
                      {entry.source === 'manual' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                ))}
              </Card>
            </Box>
          ))
      )}
    </Box>
  )
}
