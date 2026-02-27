import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { Induction, InductionRequest, Profile, Equipment } from '@/types/database'

interface InductionWithDetails extends Induction {
  equipment?: Equipment
  inducted_by_profile?: Profile
}

interface InductionRequestWithDetails extends InductionRequest {
  equipment?: Equipment
}

async function fetchMyInductions(userId: string): Promise<InductionWithDetails[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('inductions')
    .select(`
      *,
      equipment (*),
      inducted_by_profile:profiles!inductions_inducted_by_fkey (*)
    `)
    .eq('user_id', userId)
    .order('inducted_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(item => ({
    ...item,
    equipment: item.equipment,
    inducted_by_profile: item.inducted_by_profile,
  }))
}

async function fetchMyRequests(userId: string): Promise<InductionRequestWithDetails[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('induction_requests')
    .select(`
      *,
      equipment (*)
    `)
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(item => ({
    ...item,
    equipment: item.equipment,
  }))
}

export function useMyInductions(userId: string | undefined) {
  return useQuery({
    queryKey: ['myInductions', userId],
    queryFn: () => fetchMyInductions(userId!),
    enabled: !!userId,
  })
}

export function useMyInductionRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['myInductionRequests', userId],
    queryFn: () => fetchMyRequests(userId!),
    enabled: !!userId,
  })
}
