import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Equipment, Profile, InductionRequest } from '@/types/database'

export interface MaintainedEquipment extends Equipment {
  pendingRequestCount: number
}

interface InductionRequestWithDetails extends InductionRequest {
  profile?: Profile
  equipment?: Equipment
}

interface MaintainerState {
  maintainedEquipment: MaintainedEquipment[]
  pendingRequests: InductionRequestWithDetails[]
  loading: boolean
  error: string | null
}

interface MaintainerActions {
  fetchMaintainedEquipment: () => Promise<void>
  fetchPendingRequests: () => Promise<void>
  approveRequest: (requestId: string, notes?: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
}

type MaintainerStore = MaintainerState & MaintainerActions

export const useMaintainerStore = create<MaintainerStore>((set, get) => ({
  maintainedEquipment: [],
  pendingRequests: [],
  loading: false,
  error: null,

  fetchMaintainedEquipment: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get equipment IDs the user maintains
      const { data: maintainerRecords, error: maintainerError } = await supabase
        .from('equipment_maintainers')
        .select('equipment_id')
        .eq('user_id', user.id)

      if (maintainerError) throw maintainerError

      if (!maintainerRecords || maintainerRecords.length === 0) {
        set({ maintainedEquipment: [] })
        return
      }

      const equipmentIds = maintainerRecords.map(r => r.equipment_id)

      // Fetch the equipment details
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .in('id', equipmentIds)
        .order('name')

      if (equipmentError) throw equipmentError

      // Get pending request counts for each equipment
      const { data: requestCounts, error: countError } = await supabase
        .from('induction_requests')
        .select('equipment_id')
        .in('equipment_id', equipmentIds)
        .eq('status', 'pending')

      if (countError) throw countError

      // Count requests per equipment
      const countMap: Record<string, number> = {}
      requestCounts?.forEach(r => {
        countMap[r.equipment_id] = (countMap[r.equipment_id] || 0) + 1
      })

      const maintainedEquipment = (equipmentData ?? []).map(eq => ({
        ...eq,
        pendingRequestCount: countMap[eq.id] || 0,
      }))

      set({ maintainedEquipment })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchPendingRequests: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get equipment IDs the user maintains
      const { data: maintainerRecords, error: maintainerError } = await supabase
        .from('equipment_maintainers')
        .select('equipment_id')
        .eq('user_id', user.id)

      if (maintainerError) throw maintainerError

      if (!maintainerRecords || maintainerRecords.length === 0) {
        set({ pendingRequests: [] })
        return
      }

      const equipmentIds = maintainerRecords.map(r => r.equipment_id)

      // Fetch pending requests for this equipment
      const { data, error } = await supabase
        .from('induction_requests')
        .select(`
          *,
          profiles (*),
          equipment (*)
        `)
        .in('equipment_id', equipmentIds)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true })

      if (error) throw error

      const requestsWithDetails = (data ?? []).map(item => ({
        ...item,
        profile: item.profiles,
        equipment: item.equipment,
      }))

      set({ pendingRequests: requestsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  approveRequest: async (requestId, notes) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('induction_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Create the induction
      const { error: inductionError } = await supabase
        .from('inductions')
        .insert({
          user_id: request.user_id,
          equipment_id: request.equipment_id,
          inducted_by: user.id,
          notes,
        })

      if (inductionError) throw inductionError

      // Update the request status
      const { error: updateError } = await supabase
        .from('induction_requests')
        .update({ status: 'completed' })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Refresh both lists
      await Promise.all([
        get().fetchPendingRequests(),
        get().fetchMaintainedEquipment(),
      ])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  rejectRequest: async (requestId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('induction_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      // Refresh both lists
      await Promise.all([
        get().fetchPendingRequests(),
        get().fetchMaintainedEquipment(),
      ])
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
