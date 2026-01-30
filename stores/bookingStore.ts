import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Booking, Profile, Equipment } from '@/types/database'

interface BookingWithDetails extends Booking {
  profile?: Profile
  equipment?: Equipment
}

interface BookingState {
  bookings: BookingWithDetails[]
  myBookings: BookingWithDetails[]
  loading: boolean
  error: string | null
}

interface BookingActions {
  fetchBookings: (equipmentId?: string) => Promise<void>
  fetchMyBookings: () => Promise<void>
  fetchBookingsByDateRange: (equipmentId: string, start: Date, end: Date) => Promise<void>
  createBooking: (booking: Pick<Booking, 'equipment_id' | 'start_time' | 'end_time' | 'notes'>) => Promise<void>
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
}

type BookingStore = BookingState & BookingActions

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],
  myBookings: [],
  loading: false,
  error: null,

  fetchBookings: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles (*),
          equipment (*)
        `)
        .order('start_time')

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId)
      }

      const { data, error } = await query

      if (error) throw error

      const bookingsWithDetails = (data ?? []).map(item => ({
        ...item,
        profile: item.profiles,
        equipment: item.equipment,
      }))

      set({ bookings: bookingsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchMyBookings: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          equipment (*)
        `)
        .eq('user_id', user.id)
        .order('start_time')

      if (error) throw error

      const bookingsWithDetails = (data ?? []).map(item => ({
        ...item,
        equipment: item.equipment,
      }))

      set({ myBookings: bookingsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchBookingsByDateRange: async (equipmentId, start, end) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles (*)
        `)
        .eq('equipment_id', equipmentId)
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .order('start_time')

      if (error) throw error

      const bookingsWithDetails = (data ?? []).map(item => ({
        ...item,
        profile: item.profiles,
      }))

      set({ bookings: bookingsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  createBooking: async (booking) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('bookings')
        .insert({
          ...booking,
          user_id: user.id,
        })

      if (error) throw error

      await Promise.all([get().fetchBookings(), get().fetchMyBookings()])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateBooking: async (id, updates) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await Promise.all([get().fetchBookings(), get().fetchMyBookings()])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteBooking: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error

      await Promise.all([get().fetchBookings(), get().fetchMyBookings()])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
