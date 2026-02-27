import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleRecord } from '@/types/database'

async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (error) throw error

  return (data as Pick<UserRoleRecord, 'role'>[]).map(r => r.role)
}

export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ['userRoles', userId],
    queryFn: () => fetchUserRoles(userId!),
    enabled: !!userId,
  })
}
