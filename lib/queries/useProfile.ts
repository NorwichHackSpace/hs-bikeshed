import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // PGRST116 = no rows found, not an error for us
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })
}
