import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { Equipment, Profile } from '@/types/database'

export interface EquipmentWithMaintainers extends Equipment {
  maintainers?: Profile[]
}

interface MaintainerJoin {
  profiles: Profile | null
}

async function fetchEquipment(): Promise<EquipmentWithMaintainers[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      equipment_maintainers (
        profiles!equipment_maintainers_user_id_fkey (*)
      )
    `)
    .order('name')

  if (error) throw error

  return (data ?? []).map(item => ({
    ...item,
    maintainers: (item.equipment_maintainers as MaintainerJoin[])
      ?.map(em => em.profiles)
      .filter((p): p is Profile => p !== null) ?? [],
  }))
}

export function useEquipment(enabled = true) {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
    enabled,
  })
}
