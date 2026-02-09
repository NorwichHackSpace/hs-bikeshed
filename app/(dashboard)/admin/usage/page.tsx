'use client'

import { useEffect, useState, useCallback } from 'react'
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
  IconButton,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'

interface UsageEntry {
  id: string
  equipment_id: string
  user_id: string
  started_at: string
  duration_minutes: number | null
  source: string
  equipment: { name: string; category: string | null } | null
  profiles: { name: string | null } | null
}

interface EquipmentUsageStats {
  equipment_id: string
  name: string
  category: string | null
  sessionCount: number
  totalMinutes: number
  uniqueUsers: number
}

export default function AdminUsagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usageEntries, setUsageEntries] = useState<UsageEntry[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month')

  const fetchUsageData = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('equipment_usage_log')
        .select(`
          *,
          equipment (name, category),
          profiles (name)
        `)
        .order('started_at', { ascending: false })

      // Apply date filter
      if (period !== 'all') {
        const now = new Date()
        let startDate: Date
        if (period === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        }
        query = query.gte('started_at', startDate.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setUsageEntries(data ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  // Compute equipment stats
  const equipmentStats: EquipmentUsageStats[] = (() => {
    const statsMap: Record<
      string,
      Omit<EquipmentUsageStats, 'uniqueUsers'> & { userSet: Set<string> }
    > = {}

    for (const entry of usageEntries) {
      const key = entry.equipment_id
      if (!statsMap[key]) {
        statsMap[key] = {
          equipment_id: key,
          name: entry.equipment?.name ?? 'Unknown',
          category: entry.equipment?.category ?? null,
          sessionCount: 0,
          totalMinutes: 0,
          userSet: new Set(),
        }
      }
      statsMap[key].sessionCount += 1
      statsMap[key].totalMinutes += entry.duration_minutes ?? 0
      statsMap[key].userSet.add(entry.user_id)
    }

    return Object.values(statsMap)
      .map(({ userSet, ...rest }) => ({
        ...rest,
        uniqueUsers: userSet.size,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
  })()

  // Compute source breakdown
  const sourceBreakdown = usageEntries.reduce(
    (acc, entry) => {
      acc[entry.source] = (acc[entry.source] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalSessions = usageEntries.length
  const totalMinutes = usageEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)
  const uniqueUsers = new Set(usageEntries.map((e) => e.user_id)).size
  const uniqueEquipment = new Set(usageEntries.map((e) => e.equipment_id)).size

  const formatDuration = (minutes: number) => {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/admin')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Equipment Usage
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Usage reports and insights
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'all')}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="week">Last 7 days</MenuItem>
          <MenuItem value="month">This month</MenuItem>
          <MenuItem value="quarter">Last 3 months</MenuItem>
          <MenuItem value="all">All time</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>
              {totalSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sessions
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>
              {formatDuration(totalMinutes)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Time
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>
              {uniqueUsers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Members
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>
              {uniqueEquipment}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Equipment Used
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Popular Equipment */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Equipment by Usage
              </Typography>
              {equipmentStats.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No usage data for this period
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Equipment</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Sessions</TableCell>
                        <TableCell align="right">Total Time</TableCell>
                        <TableCell align="right">Users</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {equipmentStats.map((stat) => (
                        <TableRow key={stat.equipment_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {stat.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {stat.category ? (
                              <Chip label={stat.category} size="small" variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="right">{stat.sessionCount}</TableCell>
                          <TableCell align="right">
                            {stat.totalMinutes > 0 ? formatDuration(stat.totalMinutes) : '-'}
                          </TableCell>
                          <TableCell align="right">{stat.uniqueUsers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Source Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                By Source
              </Typography>
              {Object.keys(sourceBreakdown).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No data
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(sourceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <Box key={source}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {sourceLabels[source] ?? source}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0}%)
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'action.hover',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${totalSessions > 0 ? (count / totalSessions) * 100 : 0}%`,
                              borderRadius: 4,
                              backgroundColor:
                                source === 'booking'
                                  ? 'primary.main'
                                  : source === 'manual'
                                    ? 'grey.500'
                                    : 'secondary.main',
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Activity
              </Typography>
              {usageEntries.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No activity
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {usageEntries.slice(0, 10).map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {entry.equipment?.name ?? 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.started_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        label={sourceLabels[entry.source] ?? entry.source}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
