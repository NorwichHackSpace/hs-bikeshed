# TanStack Query Migration (Critical Path)

## Problem

The sequential initialization chain (auth -> profile -> roles -> app data) can get stuck if any step silently fails or the Supabase auth listener doesn't fire, leaving a permanent loading spinner. The current pattern relies on manual orchestration via useEffects and a ref-based guard, which is fragile.

## Solution

Add TanStack Query for server-state fetching. Keep Zustand for client-only state (auth session, UI preferences).

Query provides automatic retries, stale-while-revalidate, and independent parallel fetching - eliminating the brittle initialization chain.

## Architecture

### New layer

- `QueryClientProvider` wrapping the app in root layout
- Custom query hooks: `useProfile`, `useUserRoles`, `useEquipment`, `useMyBookings`, `useMyInductions`, `useMyInductionRequests`
- Queries depend on `user.id` via `enabled` option - no manual orchestration

### What changes

1. **AuthProvider** - Uses `useQuery` for profile + roles. Query handles retries automatically. The `authInitialized` + `initStarted` ref pattern replaced by Query loading states.
2. **appStore** - Removed. Query hooks fetch independently in parallel.
3. **equipmentStore** - `fetchEquipment` moves to `useEquipment()` hook. Store keeps mutation actions only.
4. **bookingStore** - `fetchMyBookings` moves to `useMyBookings()` hook. Store keeps mutation actions.
5. **inductionStore** - Fetch methods move to query hooks. Store keeps mutation actions.
6. **authStore** - Keeps session management (`initialize`, `signIn*`, `signOut`). Profile/roles fetching moves to Query.

### What stays the same

- All Zustand stores keep their mutation methods (create, update, delete)
- documentStore, transactionStore, maintainerStore, usageLogStore untouched
- Auth session management stays in Zustand

### Query pattern

```typescript
const { data: profile, isLoading } = useQuery({
  queryKey: ['profile', user?.id],
  queryFn: () => fetchProfile(user!.id),
  enabled: !!user,
  retry: 3,
  staleTime: 5 * 60 * 1000,
})
```

Each query is independent. Equipment, bookings, and inductions fire in parallel once the user is authenticated with roles.

## Scope

This is the critical-path migration only. Remaining stores (documents, transactions, maintainer, usage logs) will be migrated in a follow-up pass.

## Files to change

- `app/layout.tsx` - Add QueryClientProvider
- `lib/queries/` (new) - Query hooks + queryClient config
- `components/ui/AuthProvider.tsx` - Use query hooks
- `stores/authStore.ts` - Remove fetchProfile, keep auth session
- `stores/appStore.ts` - Remove entirely
- `stores/equipmentStore.ts` - Remove fetchEquipment, keep mutations
- `stores/bookingStore.ts` - Remove fetchMyBookings, keep mutations
- `stores/inductionStore.ts` - Remove fetch methods, keep mutations
- Components consuming these stores - Use query hooks for data, stores for mutations
