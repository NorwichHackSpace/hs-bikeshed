import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Profile, UserRole, UserRoleRecord } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  loading: boolean
  error: string | null
}

export interface SignupProfileData {
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  county: string
  postcode: string
  country: string
  interestsSkills: string
  hadTour: boolean
  hackspaceGoals: string
  shareDetailsWithMembers: 'yes' | 'no' | 'discuss'
  acceptedPolicies: boolean
  acceptedSafetyResponsibility: boolean
  isOver18: boolean
  standingOrderConfirmed: boolean
  hasMedicalConditions: boolean
  medicalConditionsDetails?: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactMobile: string
  emergencyContactLandline?: string
  referralSource: string
  optInCommunications: boolean
  optInMarketing: boolean
}

interface AuthActions {
  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, profileData: SignupProfileData) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isMaintainer: () => boolean
}

type AuthStore = AuthState & AuthActions

// Track if auth listener has been set up (prevents duplicate listeners)
let authListenerInitialized = false

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: false,
  error: null,

  initialize: async () => {
    const supabase = getClient()

    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) throw error

      if (session) {
        set({ user: session.user, session })
        await get().fetchProfile()
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }

    // Only set up auth listener once
    if (!authListenerInitialized) {
      authListenerInitialized = true
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null, session })

        if (session?.user) {
          await get().fetchProfile()
        } else {
          set({ profile: null, roles: [] })
        }
      })
    }
  },

  signInWithEmail: async (email, password) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email, password, profileData) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            address_line1: profileData.addressLine1,
            address_line2: profileData.addressLine2 || null,
            city: profileData.city,
            county: profileData.county,
            postcode: profileData.postcode,
            country: profileData.country,
            interests_skills: profileData.interestsSkills,
            had_tour: profileData.hadTour,
            hackspace_goals: profileData.hackspaceGoals,
            share_details_with_members: profileData.shareDetailsWithMembers,
            accepted_policies: profileData.acceptedPolicies,
            accepted_safety_responsibility: profileData.acceptedSafetyResponsibility,
            is_over_18: profileData.isOver18,
            standing_order_confirmed: profileData.standingOrderConfirmed,
            has_medical_conditions: profileData.hasMedicalConditions,
            medical_conditions_details: profileData.medicalConditionsDetails || null,
            emergency_contact_name: profileData.emergencyContactName,
            emergency_contact_relationship: profileData.emergencyContactRelationship,
            emergency_contact_mobile: profileData.emergencyContactMobile,
            emergency_contact_landline: profileData.emergencyContactLandline || null,
            referral_source: profileData.referralSource,
            opt_in_communications: profileData.optInCommunications,
            opt_in_marketing: profileData.optInMarketing,
          },
        },
      })
      if (error) throw error
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, session: null, profile: null, roles: [] })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchProfile: async () => {
    const supabase = getClient()
    const { user } = get()

    if (!user) return

    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Fetch roles
      const { data: roleRecords, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (rolesError) throw rolesError

      const roles = (roleRecords as Pick<UserRoleRecord, 'role'>[]).map(r => r.role)

      set({ profile, roles })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  updateProfile: async (updates) => {
    const supabase = getClient()
    const { user } = get()

    if (!user) return

    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      set({ profile: data })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  hasRole: (role) => {
    return get().roles.includes(role)
  },

  isAdmin: () => {
    return get().roles.includes('administrator')
  },

  isMaintainer: () => {
    return get().roles.includes('equipment_maintainer')
  },
}))
