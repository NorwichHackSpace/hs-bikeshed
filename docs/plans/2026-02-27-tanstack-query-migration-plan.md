# TanStack Query Migration (Critical Path) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Zustand-based data fetching with TanStack Query to fix intermittent loading spinner hangs caused by the brittle sequential initialization chain.

**Architecture:** Add TanStack Query for server-state (profile, roles, equipment, bookings, inductions). Keep Zustand for client-state (auth session, mutations). Each query hook fetches independently with automatic retries, eliminating the fragile auth → profile → roles → app data chain.

**Tech Stack:** TanStack Query v5, Zustand (retained for mutations/client state), Supabase client

---

### Task 1: Install TanStack Query and set up QueryClientProvider

**Files:**
- Modify: `app/layout.tsx`
- Create: `lib/queries/queryClient.ts`
- Create: `components/ui/QueryProvider.tsx`

**Step 1: Install @tanstack/react-query**

Run: `npm install @tanstack/react-query`

**Step 2: Create the QueryClient config**

Create `lib/queries/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: true,
      },
    },
  })
}
```

**Step 3: Create the QueryProvider wrapper**

Create `components/ui/QueryProvider.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeQueryClient } from '@/lib/queries/queryClient'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Step 4: Wire QueryProvider into root layout**

Modify `app/layout.tsx` — wrap `ThemeProvider` children with `QueryProvider`:

```typescript
import { QueryProvider } from '@/components/ui/QueryProvider'

// In RootLayout return:
<html lang="en">
  <body>
    <AppRouterCacheProvider>
      <QueryProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryProvider>
    </AppRouterCacheProvider>
  </body>
</html>
```

**Step 5: Verify build**

Run: `npx tsc --noEmit && npx next build`
Expected: Clean build, no errors.

**Step 6: Commit**

```
feat: add TanStack Query setup with QueryClientProvider
```

---

### Task 2: Create query hooks for profile and roles

**Files:**
- Create: `lib/queries/useProfile.ts`
- Create: `lib/queries/useUserRoles.ts`
- Create: `lib/queries/index.ts`

**Step 1: Create useProfile hook**

Create `lib/queries/useProfile.ts`:

```typescript
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
```

**Step 2: Create useUserRoles hook**

Create `lib/queries/useUserRoles.ts`:

```typescript
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
```

**Step 3: Create barrel export**

Create `lib/queries/index.ts`:

```typescript
export { useProfile } from './useProfile'
export { useUserRoles } from './useUserRoles'
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: Clean, no errors.

**Step 5: Commit**

```
feat: add TanStack Query hooks for profile and user roles
```

---

### Task 3: Create query hooks for equipment, bookings, and inductions

**Files:**
- Create: `lib/queries/useEquipment.ts`
- Create: `lib/queries/useMyBookings.ts`
- Create: `lib/queries/useMyInductions.ts`
- Modify: `lib/queries/index.ts`

**Step 1: Create useEquipment hook**

Create `lib/queries/useEquipment.ts`. Extract the fetch logic from `stores/equipmentStore.ts:39-72`:

```typescript
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
```

**Step 2: Create useMyBookings hook**

Create `lib/queries/useMyBookings.ts`. Extract from `stores/bookingStore.ts:74-107`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'
import type { Booking, Equipment } from '@/types/database'

export interface MyBookingWithDetails extends Booking {
  equipment?: Equipment
}

async function fetchMyBookings(userId: string): Promise<MyBookingWithDetails[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      equipment (*)
    `)
    .eq('user_id', userId)
    .order('start_time')

  if (error) throw error

  return (data ?? []).map(item => ({
    ...item,
    equipment: item.equipment,
  }))
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['myBookings', userId],
    queryFn: () => fetchMyBookings(userId!),
    enabled: !!userId,
  })
}
```

**Step 3: Create useMyInductions hook**

Create `lib/queries/useMyInductions.ts`. Extract from `stores/inductionStore.ts:89-124` and `164-197`:

```typescript
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
```

**Step 4: Update barrel export**

Add to `lib/queries/index.ts`:

```typescript
export { useEquipment, type EquipmentWithMaintainers } from './useEquipment'
export { useMyBookings } from './useMyBookings'
export { useMyInductions, useMyInductionRequests } from './useMyInductions'
```

**Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: Clean.

**Step 6: Commit**

```
feat: add TanStack Query hooks for equipment, bookings, and inductions
```

---

### Task 4: Rewrite AuthProvider to use query hooks

This is the critical task that fixes the spinner issue. Replace the sequential initialization chain with independent query hooks.

**Files:**
- Modify: `components/ui/AuthProvider.tsx`
- Modify: `stores/authStore.ts`

**Step 1: Update authStore — remove fetchProfile, keep profile/roles in state for backward compat**

In `stores/authStore.ts`, the `fetchProfile` action is called by the auth listener and `initialize`. We need to keep the auth listener working but have it set profile/roles from Query cache instead. For now, the simplest approach: keep `fetchProfile` in the store but also have Query hooks. The AuthProvider will use Query hooks for its logic. Components that read `useAuthStore(s => s.profile)` or `useAuthStore(s => s.roles)` will continue working because AuthProvider will sync Query results back into the store.

Modify `stores/authStore.ts` — add `setProfile` and `setRoles` actions:

```typescript
// Add to AuthActions interface:
setProfile: (profile: Profile | null) => void
setRoles: (roles: UserRole[]) => void

// Add implementations:
setProfile: (profile) => {
  set({ profile })
},

setRoles: (roles) => {
  set({ roles })
},
```

**Step 2: Rewrite AuthProvider**

Replace the contents of `components/ui/AuthProvider.tsx`:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore, useAppStore } from '@/stores'
import { useProfile, useUserRoles } from '@/lib/queries'
import { isProfileComplete } from '@/lib/profileValidation'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const initialize = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setRoles = useAuthStore((state) => state.setRoles)
  const [authInitialized, setAuthInitialized] = useState(false)
  const initStarted = useRef(false)

  // Phase 1: Initialize auth session (Supabase session check)
  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true
    initialize().then(() => setAuthInitialized(true))
  }, [initialize])

  // Phase 2: Fetch profile and roles via TanStack Query (automatic retries)
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useProfile(authInitialized ? user?.id : undefined)

  const {
    data: roles,
    isLoading: rolesLoading,
    isError: rolesError,
  } = useUserRoles(authInitialized ? user?.id : undefined)

  // Sync query results back to Zustand store for backward compatibility
  useEffect(() => {
    setProfile(profile ?? null)
  }, [profile, setProfile])

  useEffect(() => {
    setRoles(roles ?? [])
  }, [roles, setRoles])

  // Phase 3: Handle redirects
  useEffect(() => {
    if (!authInitialized) return
    if (!user) return

    // Wait for queries to finish
    if (profileLoading || rolesLoading) return

    if (profile && !isProfileComplete(profile)) {
      router.push('/complete-profile')
      return
    }

    if (!rolesLoading && (!roles || roles.length === 0)) {
      router.push('/pending-approval')
    }
  }, [authInitialized, user, profile, profileLoading, roles, rolesLoading, router])

  const isLoading = !authInitialized || (user && (profileLoading || rolesLoading))
  const needsRedirect = user && (
    (profile && !isProfileComplete(profile)) ||
    (!rolesLoading && (!roles || roles.length === 0))
  )

  if (isLoading || needsRedirect) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}
```

Note: This removes the dependency on `useAppStore` from AuthProvider. The app data (equipment, bookings, inductions) will be fetched by query hooks in individual pages instead of centrally in the AuthProvider.

**Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: Clean. There may be an unused import warning for `useAppStore` in AuthProvider — that's fine, we removed it.

**Step 4: Commit**

```
refactor: rewrite AuthProvider to use TanStack Query for profile/roles
```

---

### Task 5: Migrate equipment page to use query hook

**Files:**
- Modify: `app/(dashboard)/equipment/page.tsx`

**Step 1: Update equipment page**

In `app/(dashboard)/equipment/page.tsx`, change the import and data source:

Replace:
```typescript
import { useEquipmentStore, type EquipmentWithMaintainers } from '@/stores'
```
With:
```typescript
import { useEquipmentStore } from '@/stores'
import { useEquipment, type EquipmentWithMaintainers } from '@/lib/queries'
```

Replace the store destructuring:
```typescript
const { equipment, loading, initialized, error, fetchEquipment, createEquipment } =
  useEquipmentStore()
```
With:
```typescript
const { data: equipment = [], isLoading: loading, error: queryError } = useEquipment()
const { createEquipment } = useEquipmentStore()
const error = queryError?.message ?? null
```

Remove the `useEffect` that calls `fetchEquipment()` (lines 64-66) — Query handles this automatically.

Update any loading check from `!initialized && loading` to just `loading`.

**Step 2: Verify build**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
refactor: migrate equipment page to TanStack Query
```

---

### Task 6: Migrate bookings page to use query hook

**Files:**
- Modify: `app/(dashboard)/bookings/page.tsx`

**Step 1: Update bookings page**

Replace import:
```typescript
import { useBookingStore } from '@/stores'
```
With:
```typescript
import { useBookingStore } from '@/stores'
import { useMyBookings } from '@/lib/queries'
import { useAuthStore } from '@/stores'
```

Replace the store destructuring:
```typescript
const { bookings, myBookings, loading, initialized, error, fetchBookings, fetchMyBookings } =
  useBookingStore()
```
With:
```typescript
const user = useAuthStore((s) => s.user)
const { data: myBookings = [], isLoading: myBookingsLoading, error: myBookingsError } = useMyBookings(user?.id)
const { bookings, loading: bookingsLoading, error: bookingsError, fetchBookings } = useBookingStore()
const loading = myBookingsLoading || bookingsLoading
const error = myBookingsError?.message ?? bookingsError ?? null
```

Note: `bookings` (all bookings, not just mine) is still fetched from the store since the query hook only covers `myBookings`. The `fetchBookings` store method is used for the calendar view and takes an optional `equipmentId` param.

Update the `useEffect` — only call `fetchBookings()` (remove `fetchMyBookings`):
```typescript
useEffect(() => {
  fetchBookings()
}, [fetchBookings])
```

In `handleCloseDialog`, replace the refresh calls:
```typescript
const queryClient = useQueryClient()

const handleCloseDialog = useCallback(() => {
  setDialogOpen(false)
  setSelectedDate(null)
  setEditingBooking(null)
  fetchBookings()
  queryClient.invalidateQueries({ queryKey: ['myBookings'] })
}, [fetchBookings, queryClient])
```

Add import: `import { useQueryClient } from '@tanstack/react-query'`

**Step 2: Verify build**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
refactor: migrate bookings page to use TanStack Query for myBookings
```

---

### Task 7: Migrate inductions page to use query hooks

**Files:**
- Modify: `app/(dashboard)/inductions/page.tsx`

**Step 1: Update inductions page**

Replace import:
```typescript
import { useInductionStore } from '@/stores'
```
With:
```typescript
import { useInductionStore } from '@/stores'
import { useMyInductions, useMyInductionRequests } from '@/lib/queries'
import { useAuthStore } from '@/stores'
```

Replace the store destructuring:
```typescript
const { myInductions, myRequests, loading, initialized, error, fetchMyInductions, fetchMyRequests } =
  useInductionStore()
```
With:
```typescript
const user = useAuthStore((s) => s.user)
const { data: myInductions = [], isLoading: inductionsLoading, error: inductionsError } = useMyInductions(user?.id)
const { data: myRequests = [], isLoading: requestsLoading, error: requestsError } = useMyInductionRequests(user?.id)
const loading = inductionsLoading || requestsLoading
const error = inductionsError?.message ?? requestsError?.message ?? null
```

Remove the `useEffect` that calls `fetchMyInductions()` and `fetchMyRequests()` (lines 27-30).

Update the loading check from `!initialized && loading` to just `loading`.

**Step 2: Verify build**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
refactor: migrate inductions page to TanStack Query
```

---

### Task 8: Update equipment detail page and BookingDialog

**Files:**
- Modify: `app/(dashboard)/equipment/[category]/[id]/page.tsx`
- Modify: `components/features/BookingDialog.tsx`

**Step 1: Update equipment detail page**

This page uses `useEquipmentStore` for `fetchEquipmentById` and `selectedEquipment`, plus `useInductionStore` for `myInductions` and `useBookingStore` for `myBookings`.

For the detail page, keep `fetchEquipmentById` from the store since it's a parameterized fetch for a single item. The key changes:

Replace `useInductionStore` usage for `myInductions`:
```typescript
import { useMyInductions, useMyInductionRequests, useMyBookings } from '@/lib/queries'

// Replace destructured myInductions, myRequests, fetchMyInductions, fetchMyRequests from useInductionStore:
const user = useAuthStore((s) => s.user)
const { data: myInductions = [] } = useMyInductions(user?.id)
const { data: myRequests = [] } = useMyInductionRequests(user?.id)
const { data: myBookings = [] } = useMyBookings(user?.id)

// Keep from useInductionStore only mutation actions:
const { createRequest, loading: inductionLoading } = useInductionStore()

// Keep from useBookingStore only mutation actions:
const { deleteBooking } = useBookingStore()
```

Remove `useEffect` calls for `fetchMyInductions`, `fetchMyRequests`, `fetchMyBookings`.

After mutations (e.g., `createRequest`, `deleteBooking`), invalidate relevant queries:
```typescript
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()

// After createRequest succeeds:
queryClient.invalidateQueries({ queryKey: ['myInductionRequests'] })

// After deleteBooking succeeds:
queryClient.invalidateQueries({ queryKey: ['myBookings'] })
```

**Step 2: Update BookingDialog**

In `components/features/BookingDialog.tsx`:

Replace `useEquipmentStore` for reading equipment list:
```typescript
import { useEquipment } from '@/lib/queries'

// Replace:
const { equipment, fetchEquipment } = useEquipmentStore()
// With:
const { data: equipment = [] } = useEquipment()
```

Keep `useBookingStore` for mutations (`createBooking`, `updateBooking`, `deleteBooking`).

Remove `useEffect` for `fetchEquipment` if present.

**Step 3: Verify build**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```
refactor: migrate equipment detail page and BookingDialog to TanStack Query
```

---

### Task 9: Remove appStore and clean up

**Files:**
- Delete: `stores/appStore.ts`
- Modify: `stores/index.ts`
- Modify: `stores/authStore.ts` (remove `fetchProfile` if no longer called)

**Step 1: Remove appStore**

Delete `stores/appStore.ts`.

Remove from `stores/index.ts`:
```typescript
export { useAppStore } from './appStore'
```

**Step 2: Clean up authStore**

In `stores/authStore.ts`, the `fetchProfile` method is still called by the auth state change listener (line 93). We should keep it for now since it syncs profile on auth changes, OR replace it with a simpler version that just sets profile/roles.

Since the AuthProvider now syncs Query results to the store, and the auth listener also runs `fetchProfile`, there's a potential double-fetch. Simplify the auth listener to NOT fetch profile (Query handles it):

In `stores/authStore.ts`, modify the `onAuthStateChange` callback:
```typescript
supabase.auth.onAuthStateChange(async (_event, session) => {
  set({ user: session?.user ?? null, session })

  if (!session?.user) {
    set({ profile: null, roles: [] })
  }
  // Profile and roles are now fetched by TanStack Query hooks in AuthProvider
})
```

Also simplify `initialize` — remove the `fetchProfile` call:
```typescript
initialize: async () => {
  const supabase = getClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

    if (session) {
      set({ user: session.user, session })
      // Profile and roles are now fetched by TanStack Query hooks
    }
  } catch (error) {
    set({ error: (error as Error).message })
  }

  if (!authListenerInitialized) {
    authListenerInitialized = true
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session })
      if (!session?.user) {
        set({ profile: null, roles: [] })
      }
    })
  }
},
```

Remove `fetchProfile` from `AuthActions` interface and implementation. Keep `updateProfile` since it's used for profile edits.

**Step 3: Clean up equipmentStore — remove EquipmentWithMaintainers export from stores/index.ts if unused**

Check if any file still imports `EquipmentWithMaintainers` from `@/stores`. If all imports have been changed to `@/lib/queries`, remove the re-export from `stores/index.ts`. If some files still import from stores, keep it for now.

**Step 4: Verify build**

Run: `npx tsc --noEmit && npx next build`
Expected: Clean build. All pages render.

**Step 5: Commit**

```
refactor: remove appStore, clean up authStore after TanStack Query migration
```

---

### Task 10: Invalidate queries on mutations in stores

**Files:**
- Modify: `stores/equipmentStore.ts`
- Modify: `stores/bookingStore.ts`
- Modify: `stores/inductionStore.ts`

Mutation methods in stores (createEquipment, updateEquipment, deleteEquipment, createBooking, etc.) currently call `fetchEquipment()` / `fetchMyBookings()` after mutating. These should instead invalidate the relevant Query cache so Query refetches automatically.

**Step 1: Create a shared queryClient singleton**

Modify `lib/queries/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: true,
      },
    },
  })
}

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
```

Update `components/ui/QueryProvider.tsx` to use `getQueryClient()`:

```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queries/queryClient'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Step 2: Update equipmentStore mutations**

In `stores/equipmentStore.ts`, replace `await get().fetchEquipment()` calls with query invalidation:

```typescript
import { getQueryClient } from '@/lib/queries/queryClient'

// In createEquipment, updateEquipment, deleteEquipment — replace:
//   await get().fetchEquipment()
// With:
getQueryClient().invalidateQueries({ queryKey: ['equipment'] })
```

Remove `fetchEquipment` from the store entirely (it's now in the Query hook). Keep `fetchEquipmentById` since it's for the detail page.

**Step 3: Update bookingStore mutations**

In `stores/bookingStore.ts`, replace:
```typescript
await Promise.all([get().fetchBookings(), get().fetchMyBookings()])
```
With:
```typescript
import { getQueryClient } from '@/lib/queries/queryClient'

getQueryClient().invalidateQueries({ queryKey: ['myBookings'] })
await get().fetchBookings()  // Keep this — bookings list isn't migrated to Query yet
```

Remove `fetchMyBookings` from the store.

**Step 4: Update inductionStore mutations**

In `stores/inductionStore.ts`, after `createRequest`:
```typescript
import { getQueryClient } from '@/lib/queries/queryClient'

// Replace: await get().fetchMyRequests()
// With:
getQueryClient().invalidateQueries({ queryKey: ['myInductionRequests'] })
```

After `approveRequest`, `rejectRequest`:
```typescript
// Keep: await get().fetchRequests()  — requests list isn't migrated yet
// Add:
getQueryClient().invalidateQueries({ queryKey: ['myInductions'] })
```

After `createInduction`:
```typescript
// Keep: await get().fetchInductions()
// Add:
getQueryClient().invalidateQueries({ queryKey: ['myInductions'] })
```

Remove `fetchMyInductions` and `fetchMyRequests` from the store.

**Step 5: Verify build**

Run: `npx tsc --noEmit && npx next build`
Expected: Clean build.

**Step 6: Commit**

```
refactor: invalidate TanStack Query cache on store mutations
```

---

### Task 11: Final verification and cleanup

**Files:**
- Various — grep for dead code

**Step 1: Search for unused imports**

Run: `npx tsc --noEmit` and check for any "declared but never read" warnings.

Fix any unused imports.

**Step 2: Search for dead store exports**

Check `stores/index.ts` for exports that are no longer imported anywhere.

Grep for each export to verify it's still used:
- `useAppStore` should be gone
- `EquipmentWithMaintainers` — check if still imported from `@/stores` anywhere

**Step 3: Full build and manual test**

Run: `npx next build`
Expected: Clean build with all pages.

**Step 4: Commit any cleanup**

```
chore: clean up unused imports after TanStack Query migration
```
