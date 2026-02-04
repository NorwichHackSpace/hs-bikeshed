import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Equipment, Profile } from '@/types/database'

export interface EquipmentWithMaintainers extends Equipment {
  maintainers?: Profile[]
}

interface EquipmentState {
  equipment: EquipmentWithMaintainers[]
  selectedEquipment: EquipmentWithMaintainers | null
  loading: boolean
  initialized: boolean
  error: string | null
}

interface EquipmentActions {
  fetchEquipment: () => Promise<void>
  fetchEquipmentById: (id: string) => Promise<void>
  createEquipment: (equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>
  deleteEquipment: (id: string) => Promise<void>
  clearSelected: () => void
}

type EquipmentStore = EquipmentState & EquipmentActions

interface MaintainerJoin {
  profiles: Profile | null
}

export const useEquipmentStore = create<EquipmentStore>((set, get) => ({
  equipment: [],
  selectedEquipment: null,
  loading: false,
  initialized: false,
  error: null,

  fetchEquipment: async () => {
    const supabase = getClient()
    // Only show loading if not yet initialized (first load)
    if (!get().initialized) {
      set({ loading: true, error: null })
    }

    try {
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

      // Transform the nested data
      const equipmentWithMaintainers = (data ?? []).map(item => ({
        ...item,
        maintainers: (item.equipment_maintainers as MaintainerJoin[])
          ?.map(em => em.profiles)
          .filter((p): p is Profile => p !== null) ?? [],
      }))

      set({ equipment: equipmentWithMaintainers, initialized: true })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchEquipmentById: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_maintainers (
            profiles!equipment_maintainers_user_id_fkey (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const equipmentWithMaintainers = {
        ...data,
        maintainers: (data.equipment_maintainers as MaintainerJoin[])
          ?.map(em => em.profiles)
          .filter((p): p is Profile => p !== null) ?? [],
      }

      set({ selectedEquipment: equipmentWithMaintainers })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  createEquipment: async (equipment) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('equipment')
        .insert(equipment)

      if (error) throw error

      await get().fetchEquipment()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateEquipment: async (id, updates) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await get().fetchEquipment()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteEquipment: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)

      if (error) throw error

      await get().fetchEquipment()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  clearSelected: () => {
    set({ selectedEquipment: null })
  },
}))
