'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  alpha,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ListIcon from '@mui/icons-material/List'
import EventIcon from '@mui/icons-material/Event'
import { useBookingStore } from '@/stores'
import { BookingCalendar } from '@/components/features/BookingCalendar'
import { BookingDialog } from '@/components/features/BookingDialog'
import type { Booking, Equipment } from '@/types/database'

interface BookingWithDetails extends Booking {
  equipment?: Equipment
}

export default function BookingsPage() {
  const { bookings, myBookings, loading, error, fetchBookings, fetchMyBookings } =
    useBookingStore()

  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingBooking, setEditingBooking] = useState<BookingWithDetails | null>(null)

  useEffect(() => {
    fetchBookings()
    fetchMyBookings()
  }, [fetchBookings, fetchMyBookings])

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date)
    setEditingBooking(null)
    setDialogOpen(true)
  }, [])

  const handleBookingClick = useCallback((booking: BookingWithDetails) => {
    setEditingBooking(booking)
    setSelectedDate(null)
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setSelectedDate(null)
    setEditingBooking(null)
    // Refresh bookings
    fetchBookings()
    fetchMyBookings()
  }, [fetchBookings, fetchMyBookings])

  const handleNewBooking = () => {
    setSelectedDate(new Date())
    setEditingBooking(null)
    setDialogOpen(true)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimeRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startTime = startDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const endTime = endDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${startTime} - ${endTime}`
  }

  const upcomingBookings = myBookings.filter(
    (b) => new Date(b.end_time) > new Date()
  )

  if (loading && bookings.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage equipment bookings.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="calendar">
              <CalendarMonthIcon sx={{ mr: 0.5 }} fontSize="small" />
              Calendar
            </ToggleButton>
            <ToggleButton value="list">
              <ListIcon sx={{ mr: 0.5 }} fontSize="small" />
              My Bookings
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewBooking}
          >
            New Booking
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {view === 'calendar' ? (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <BookingCalendar
              bookings={bookings}
              onDayClick={handleDayClick}
              onBookingClick={handleBookingClick}
            />
          </CardContent>
        </Card>
      ) : (
        <Box>
          {myBookings.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No bookings yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click the calendar to book equipment.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewBooking}
                >
                  Create Your First Booking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {upcomingBookings.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Upcoming Bookings
                    </Typography>
                    <List disablePadding>
                      {upcomingBookings.map((booking, index) => (
                        <Box key={booking.id}>
                          {index > 0 && <Divider />}
                          <ListItem
                            onClick={() => handleBookingClick(booking)}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontWeight={600}>
                                    {booking.equipment?.name ?? 'Unknown equipment'}
                                  </Typography>
                                  <Chip
                                    label={formatTimeRange(booking.start_time, booking.end_time)}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={formatDateTime(booking.start_time)}
                            />
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {myBookings.filter((b) => new Date(b.end_time) <= new Date()).length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="text.secondary">
                      Past Bookings
                    </Typography>
                    <List disablePadding>
                      {myBookings
                        .filter((b) => new Date(b.end_time) <= new Date())
                        .slice(0, 10)
                        .map((booking, index) => (
                          <Box key={booking.id}>
                            {index > 0 && <Divider />}
                            <ListItem sx={{ opacity: 0.7 }}>
                              <ListItemText
                                primary={booking.equipment?.name ?? 'Unknown equipment'}
                                secondary={`${formatDateTime(booking.start_time)} - ${formatTimeRange(booking.start_time, booking.end_time)}`}
                              />
                            </ListItem>
                          </Box>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      )}

      <BookingDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedDate={selectedDate}
        booking={editingBooking}
      />
    </Box>
  )
}
