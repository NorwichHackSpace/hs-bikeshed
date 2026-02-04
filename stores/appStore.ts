import { create } from 'zustand'
import { useEquipmentStore } from './equipmentStore'
import { useBookingStore } from './bookingStore'
import { useInductionStore } from './inductionStore'

interface AppState {
  initialized: boolean
  initializing: boolean
  error: string | null
}

interface AppActions {
  initializeApp: () => Promise<void>
  resetApp: () => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  initializing: false,
  error: null,

  initializeApp: async () => {
    // Prevent duplicate initialization
    if (get().initialized || get().initializing) return

    set({ initializing: true, error: null })

    try {
      // Fetch all common data in parallel
      await Promise.all([
        useEquipmentStore.getState().fetchEquipment(),
        useBookingStore.getState().fetchMyBookings(),
        useInductionStore.getState().fetchMyInductions(),
        useInductionStore.getState().fetchMyRequests(),
      ])

      set({ initialized: true })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ initializing: false })
    }
  },

  resetApp: () => {
    set({ initialized: false, initializing: false, error: null })
  },
}))
