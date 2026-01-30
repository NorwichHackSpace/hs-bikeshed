'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Chip,
  alpha,
  useTheme,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import type { Booking, Equipment, Profile } from '@/types/database'

interface BookingWithDetails extends Booking {
  equipment?: Equipment
  profile?: Profile
}

interface BookingCalendarProps {
  bookings: BookingWithDetails[]
  onDayClick: (date: Date) => void
  onBookingClick: (booking: BookingWithDetails) => void
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function BookingCalendar({
  bookings,
  onDayClick,
  onBookingClick,
}: BookingCalendarProps) {
  const theme = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get day of week (0 = Sunday, adjust for Monday start)
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6

    const daysInMonth = lastDayOfMonth.getDate()
    const days: (Date | null)[] = []

    // Add empty slots for days before the first
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    // Fill remaining slots to complete the grid
    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }, [year, month])

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingWithDetails[]>()

    bookings.forEach((booking) => {
      const date = new Date(booking.start_time)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(booking)
    })

    return map
  }, [bookings])

  const getBookingsForDate = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return bookingsByDate.get(key) ?? []
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goToPreviousMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600} sx={{ minWidth: 200, textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </Typography>
          <IconButton onClick={goToNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <IconButton onClick={goToToday} size="small" title="Go to today">
          <TodayIcon />
        </IconButton>
      </Box>

      {/* Day headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          mb: 1,
        }}
      >
        {DAYS_OF_WEEK.map((day) => (
          <Typography
            key={day}
            variant="subtitle2"
            align="center"
            color="text.secondary"
            fontWeight={600}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
        }}
      >
        {calendarDays.map((date, index) => {
          if (!date) {
            return <Box key={`empty-${index}`} sx={{ minHeight: 120 }} />
          }

          const dayBookings = getBookingsForDate(date)
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

          return (
            <Paper
              key={date.toISOString()}
              onClick={isPast ? undefined : () => onDayClick(date)}
              sx={{
                minHeight: 120,
                p: 1,
                cursor: isPast ? 'default' : 'pointer',
                transition: 'all 200ms ease-in-out',
                backgroundColor: isToday(date)
                  ? alpha(theme.palette.primary.main, 0.08)
                  : 'background.paper',
                opacity: isPast ? 0.5 : 1,
                ...(!isPast && {
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.02)',
                  },
                }),
              }}
            >
              <Typography
                variant="body2"
                fontWeight={isToday(date) ? 700 : 500}
                color={isToday(date) ? 'primary' : 'text.primary'}
                sx={{ mb: 0.5 }}
              >
                {date.getDate()}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {dayBookings.slice(0, 3).map((booking) => (
                  <Chip
                    key={booking.id}
                    label={`${formatTime(booking.start_time)} ${booking.equipment?.name ?? 'Equipment'}${booking.profile?.name ? ` - ${booking.profile.name}` : ''}`}
                    size="small"
                    onClick={
                      isPast
                        ? undefined
                        : (e) => {
                            e.stopPropagation()
                            onBookingClick(booking)
                          }
                    }
                    sx={{
                      height: 'auto',
                      py: 0.25,
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.dark,
                      cursor: isPast ? 'default' : 'pointer',
                      '& .MuiChip-label': {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        px: 0.75,
                      },
                      ...(!isPast && {
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.25),
                        },
                      }),
                    }}
                  />
                ))}
                {dayBookings.length > 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: '0.65rem', pl: 0.5 }}
                  >
                    +{dayBookings.length - 3} more
                  </Typography>
                )}
              </Box>
            </Paper>
          )
        })}
      </Box>
    </Box>
  )
}
