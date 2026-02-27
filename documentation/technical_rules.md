# BikeShed Technical Rules

Technical guidelines for AI assistants and developers working on this project.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | Material UI (MUI) |
| State Management | Zustand (auth, mutations) + TanStack Query (server data) |
| Form State | Formik + Yup (form state and validation) |
| Backend | Supabase (Postgres, Auth, RLS) |
| Data Fetching | TanStack Query (`lib/queries/`) for reads; Zustand stores for mutations |

---

## Project Structure

```
nhs-bikeshed/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes (login, signup)
│   ├── (dashboard)/       # Protected routes
│   ├── auth/callback/     # OAuth callback
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React components
│   ├── ui/               # Generic UI components
│   └── features/         # Feature-specific components
├── stores/               # Zustand stores (auth state, mutations)
├── lib/                  # Utilities and configurations
│   ├── supabase/        # Supabase client setup
│   └── queries/         # TanStack Query hooks for data fetching
├── types/               # TypeScript type definitions
├── theme/               # MUI theme configuration
├── documentation/       # Project documentation
└── middleware.ts        # Route protection
```

---

## Rules

### Next.js

- Use the **App Router** (`app/` directory), not Pages Router
- Use **Server Components** by default; add `'use client'` only when necessary
- Use **Route Groups** `(folder)` for logical organization without affecting URLs
- Use `loading.tsx` and `error.tsx` for loading/error states
- API routes go in `app/api/` if needed, but prefer direct Supabase calls

### TypeScript

- Strict mode enabled
- Define types for all Supabase tables in `types/database.ts`
- Use generated types from Supabase when available
- No `any` types; use `unknown` and narrow appropriately
- Prefer interfaces for object shapes, types for unions/primitives

### Material UI

- Use MUI components as the primary UI building blocks
- Configure theme in `theme/` with hackspace branding
- Use `sx` prop for one-off styling
- Use `styled()` or theme overrides for reusable styled components
- Prefer MUI's built-in icons (`@mui/icons-material`)

### Data Fetching — TanStack Query

Read-only data fetching uses TanStack Query hooks in `lib/queries/`. This gives automatic caching, background refetching, and deduplication.

**Existing query hooks:**

| Hook | Key | Source |
|------|-----|--------|
| `useProfile(userId)` | `['profile', userId]` | `lib/queries/useProfile.ts` |
| `useUserRoles(userId)` | `['userRoles', userId]` | `lib/queries/useUserRoles.ts` |
| `useEquipment()` | `['equipment']` | `lib/queries/useEquipment.ts` |
| `useMyBookings(userId)` | `['myBookings', userId]` | `lib/queries/useMyBookings.ts` |
| `useMyInductions(userId)` | `['myInductions', userId]` | `lib/queries/useMyInductions.ts` |
| `useMyInductionRequests(userId)` | `['myInductionRequests', userId]` | `lib/queries/useMyInductions.ts` |

**Query client** is configured in `lib/queries/queryClient.ts` with 5-minute stale time, 3 retries, and refetch on window focus.

**Query hook pattern:**

```typescript
import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/lib/supabase/client'

async function fetchEquipment(): Promise<EquipmentWithMaintainers[]> {
  const supabase = getClient()
  const { data, error } = await supabase.from('equipment').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export function useEquipment(enabled = true) {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
    enabled,
  })
}
```

**Invalidation after mutations:** Zustand store mutations call `getQueryClient().invalidateQueries()` to refresh relevant queries after creates/updates/deletes.

### Zustand — Auth & Mutations

Zustand stores remain for auth state (`useAuthStore`) and domain-specific mutations (create, update, delete operations). Stores that still exist: `authStore`, `equipmentStore`, `bookingStore`, `inductionStore`, `transactionStore`, `maintainerStore`, `documentStore`, `usageLogStore`, `themeStore`.

- Keep stores flat; avoid deeply nested state
- Mutation stores should invalidate relevant TanStack Query keys after successful writes
- `useAuthStore` holds `user`, `profile`, `roles`, and auth methods (sign in, sign out, etc.)

**Store pattern (mutations):**

```typescript
import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import { getQueryClient } from '@/lib/queries/queryClient'

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  loading: false,
  error: null,
  createEquipment: async (data) => {
    const supabase = getClient()
    set({ loading: true, error: null })
    const { error } = await supabase.from('equipment').insert(data)
    set({ loading: false, error: error?.message ?? null })
    if (!error) getQueryClient().invalidateQueries({ queryKey: ['equipment'] })
  },
}))
```

### Formik

- Use **Formik** for all form state management
- Use **Yup** for validation schemas
- Keep form state local to the component (not in Zustand)
- Use `formik.handleChange` for simple inputs
- Use `formik.setFieldValue` for complex inputs (Autocomplete, custom components)
- Wrap forms in `<form onSubmit={formik.handleSubmit}>`

**Form pattern:**

```typescript
import { useFormik } from 'formik'
import * as Yup from 'yup'

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
})

const formik = useFormik({
  initialValues: { name: '', email: '' },
  validationSchema,
  onSubmit: async (values, { setSubmitting }) => {
    await saveData(values)
    setSubmitting(false)
  },
})

// In JSX:
<TextField
  name="name"
  value={formik.values.name}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.name && Boolean(formik.errors.name)}
  helperText={formik.touched.name && formik.errors.name}
/>
```

### Supabase

- Use `@supabase/supabase-js` client SDK
- Create client in `lib/supabase/client.ts` (browser) and `server.ts` (server components)
- Rely on RLS policies for authorization; do not duplicate auth logic in frontend
- Use real-time subscriptions sparingly and only where needed (e.g., booking calendar)

### Authentication

- Use Supabase Auth with email/password (primary) or Google OAuth (optional)
- Protect routes using middleware or layout-level auth checks
- Store session in Supabase's built-in session management
- Auth state managed via `useAuthStore`

### Code Style

- Use ESLint and Prettier
- Functional components only
- Named exports (not default exports) for components
- Collocate tests with source files (`Component.test.tsx`)

---

## Do Not

- Do not use Pages Router (`pages/` directory)
- Do not use Redux or SWR (use TanStack Query for reads + Zustand for mutations)
- Do not bypass RLS with service role key in frontend
- Do not store sensitive data in client-side state
- Do not use CSS modules or Tailwind (use MUI's styling system)
- Do not put code in a `src/` directory
