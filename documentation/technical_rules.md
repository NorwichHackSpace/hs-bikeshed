# BikeShed Technical Rules

Technical guidelines for AI assistants and developers working on this project.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | Material UI (MUI) |
| State Management | Zustand (shared/application state) |
| Form State | Formik + Yup (form state and validation) |
| Backend | Supabase (Postgres, Auth, RLS) |
| Data Fetching | Supabase JS SDK (via Zustand stores) |

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
├── stores/               # Zustand stores
├── lib/                  # Utilities and configurations
│   └── supabase/        # Supabase client setup
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

### Zustand

- One store per domain: `useAuthStore`, `useEquipmentStore`, `useBookingStore`, etc.
- Stores handle all Supabase data fetching and mutations
- Keep stores flat; avoid deeply nested state
- Use `immer` middleware if mutations become complex
- Stores should expose:
  - State (data, loading, error)
  - Actions (fetch, create, update, delete)

**Store pattern:**

```typescript
import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'

interface EquipmentStore {
  equipment: Equipment[]
  loading: boolean
  error: string | null
  fetchEquipment: () => Promise<void>
}

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  equipment: [],
  loading: false,
  error: null,
  fetchEquipment: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
    set({
      equipment: data ?? [],
      loading: false,
      error: error?.message ?? null
    })
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
- Do not use Redux, React Query, or SWR (use Zustand + direct Supabase calls)
- Do not bypass RLS with service role key in frontend
- Do not store sensitive data in client-side state
- Do not use CSS modules or Tailwind (use MUI's styling system)
- Do not put code in a `src/` directory
