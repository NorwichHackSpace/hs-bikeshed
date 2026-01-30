import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Induction, InductionRequest, Profile, Equipment } from '@/types/database'

interface InductionWithDetails extends Induction {
  profile?: Profile
  equipment?: Equipment
  inducted_by_profile?: Profile
}

interface InductionRequestWithDetails extends InductionRequest {
  profile?: Profile
  equipment?: Equipment
}

interface InductionState {
  inductions: InductionWithDetails[]
  myInductions: InductionWithDetails[]
  requests: InductionRequestWithDetails[]
  myRequests: InductionRequestWithDetails[]
  loading: boolean
  error: string | null
}

interface InductionActions {
  fetchInductions: (equipmentId?: string) => Promise<void>
  fetchMyInductions: () => Promise<void>
  fetchRequests: (equipmentId?: string) => Promise<void>
  fetchMyRequests: () => Promise<void>
  createRequest: (equipmentId: string, notes?: string) => Promise<void>
  approveRequest: (requestId: string, notes?: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
  createInduction: (userId: string, equipmentId: string, notes?: string) => Promise<void>
  isInductedOn: (equipmentId: string) => boolean
}

type InductionStore = InductionState & InductionActions

export const useInductionStore = create<InductionStore>((set, get) => ({
  inductions: [],
  myInductions: [],
  requests: [],
  myRequests: [],
  loading: false,
  error: null,

  fetchInductions: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      let query = supabase
        .from('inductions')
        .select(`
          *,
          profiles!inductions_user_id_fkey (*),
          equipment (*),
          inducted_by_profile:profiles!inductions_inducted_by_fkey (*)
        `)
        .order('inducted_at', { ascending: false })

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId)
      }

      const { data, error } = await query

      if (error) throw error

      const inductionsWithDetails = (data ?? []).map(item => ({
        ...item,
        profile: item.profiles,
        equipment: item.equipment,
        inducted_by_profile: item.inducted_by_profile,
      }))

      set({ inductions: inductionsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchMyInductions: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('inductions')
        .select(`
          *,
          equipment (*),
          inducted_by_profile:profiles!inductions_inducted_by_fkey (*)
        `)
        .eq('user_id', user.id)
        .order('inducted_at', { ascending: false })

      if (error) throw error

      const inductionsWithDetails = (data ?? []).map(item => ({
        ...item,
        equipment: item.equipment,
        inducted_by_profile: item.inducted_by_profile,
      }))

      set({ myInductions: inductionsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchRequests: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      let query = supabase
        .from('induction_requests')
        .select(`
          *,
          profiles (*),
          equipment (*)
        `)
        .order('requested_at', { ascending: false })

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId)
      }

      const { data, error } = await query

      if (error) throw error

      const requestsWithDetails = (data ?? []).map(item => ({
        ...item,
        profile: item.profiles,
        equipment: item.equipment,
      }))

      set({ requests: requestsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchMyRequests: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('induction_requests')
        .select(`
          *,
          equipment (*)
        `)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })

      if (error) throw error

      const requestsWithDetails = (data ?? []).map(item => ({
        ...item,
        equipment: item.equipment,
      }))

      set({ myRequests: requestsWithDetails })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  createRequest: async (equipmentId, notes) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('induction_requests')
        .insert({
          user_id: user.id,
          equipment_id: equipmentId,
          notes,
        })

      if (error) throw error

      await get().fetchMyRequests()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
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

      await get().fetchRequests()
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

      await get().fetchRequests()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  createInduction: async (userId, equipmentId, notes) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('inductions')
        .insert({
          user_id: userId,
          equipment_id: equipmentId,
          inducted_by: user.id,
          notes,
        })

      if (error) throw error

      await get().fetchInductions()
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  isInductedOn: (equipmentId) => {
    return get().myInductions.some(i => i.equipment_id === equipmentId)
  },
}))
