import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { Booking, Equipment } from '@/types/database'

export interface MyBookingWithDetails extends Booking {
  equipment?: Equipment
}

async function fetchMyBookings(userId: string): Promise<MyBookingWithDetails[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      equipment (*)
    `)
    .eq('user_id', userId)
    .order('start_time')

  if (error) throw error

  return (data ?? []).map(item => ({
    ...item,
    equipment: item.equipment,
  }))
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['myBookings', userId],
    queryFn: () => fetchMyBookings(userId!),
    enabled: !!userId,
  })
}
