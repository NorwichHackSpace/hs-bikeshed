import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type {
  EquipmentUsageLog,
  UsageLogWithEquipment,
  EquipmentUsageSummary,
} from '@/types/database'

interface UsageLogState {
  equipmentUsage: EquipmentUsageLog[]
  myUsage: UsageLogWithEquipment[]
  loading: boolean
  error: string | null
}

interface UsageLogActions {
  logUsage: (entry: {
    equipment_id: string
    duration_minutes?: number | null
    notes?: string | null
  }) => Promise<void>
  fetchUsageByEquipment: (equipmentId: string) => Promise<void>
  fetchMyUsage: () => Promise<void>
  fetchEquipmentUsageSummary: (equipmentId: string) => Promise<EquipmentUsageSummary>
  deleteUsageLog: (id: string) => Promise<void>
}

type UsageLogStore = UsageLogState & UsageLogActions

export const useUsageLogStore = create<UsageLogStore>((set, get) => ({
  equipmentUsage: [],
  myUsage: [],
  loading: false,
  error: null,

  logUsage: async (entry) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('equipment_usage_log').insert({
        equipment_id: entry.equipment_id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        duration_minutes: entry.duration_minutes ?? null,
        notes: entry.notes ?? null,
        source: 'manual',
      })

      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchUsageByEquipment: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('started_at', { ascending: false })

      if (error) throw error

      set({ equipmentUsage: data ?? [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchMyUsage: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select(`
          *,
          equipment (*)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

      if (error) throw error

      const usageWithEquipment: UsageLogWithEquipment[] = (data ?? []).map(
        (item) => ({
          ...item,
          equipment: item.equipment,
        })
      )

      set({ myUsage: usageWithEquipment })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchEquipmentUsageSummary: async (equipmentId) => {
    const supabase = getClient()

    try {
      // Get all usage for this equipment
      const { data, error } = await supabase
        .from('equipment_usage_log')
        .select('started_at, duration_minutes, user_id')
        .eq('equipment_id', equipmentId)

      if (error) throw error

      const entries = data ?? []
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const sessionsThisMonth = entries.filter(
        (e) => new Date(e.started_at) >= startOfMonth
      ).length

      const totalMinutes = entries.reduce(
        (sum, e) => sum + (e.duration_minutes ?? 0),
        0
      )

      const uniqueUsers = new Set(entries.map((e) => e.user_id)).size

      return {
        totalSessions: entries.length,
        totalMinutes,
        sessionsThisMonth,
        uniqueUsers,
      }
    } catch (error) {
      set({ error: (error as Error).message })
      return {
        totalSessions: 0,
        totalMinutes: 0,
        sessionsThisMonth: 0,
        uniqueUsers: 0,
      }
    }
  },

  deleteUsageLog: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('equipment_usage_log')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      set({
        myUsage: get().myUsage.filter((u) => u.id !== id),
        equipmentUsage: get().equipmentUsage.filter((u) => u.id !== id),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
