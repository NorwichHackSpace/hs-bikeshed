# OAuth Profile Completion & Form Deduplication

## Problem

1. Users who sign up via Google OAuth bypass the membership form entirely. Their auth account is created but no profile row exists in the `profiles` table.
2. The `/signup` and `/complete-profile` pages duplicate ~400 lines of identical form step rendering, validation schemas, and field definitions.
3. The middleware does not enforce profile completion or role assignment, so OAuth users can navigate directly to dashboard routes with no profile.

## Design

### Shared component: `components/auth/MembershipFormSteps.tsx`

Extracts from the duplicated pages:

- **`profileValidationSchema`** - Yup schema for all profile fields (Personal Info through Agreements)
- **`profileStepFields`** - which fields to validate per step
- **`PROFILE_STEPS`** - step labels array (`['Personal Info', 'Address', 'About You', 'Emergency Contact', 'Agreements']`)
- **`profileInitialValues`** - default form values
- **`ProfileFormValues`** type - shared interface for profile form fields
- **`renderProfileStep(step, formik, options?)`** - renders form fields for a given step index. Accepts optional `email` string to show as disabled field on Personal Info step (for OAuth users).

### Middleware enforcement: `lib/supabase/middleware.ts`

For authenticated users on dashboard routes:

1. Query `profiles` table for user's ID
2. If no profile row exists, redirect to `/complete-profile`
3. If profile exists but no roles in `user_roles`, redirect to `/pending-approval`
4. Excluded from checks: `/complete-profile`, `/pending-approval`, `/auth/callback`

### Page changes

- **`/signup`**: Uses shared validation/steps. Keeps Account step (step 0). Steps 1-5 use `renderProfileStep(0..4, formik)`.
- **`/complete-profile`**: Uses shared validation/steps. Steps 0-4 use `renderProfileStep(0..4, formik, { email })`. Submit logic stays as direct `profiles` table insert.

### Style consistency

Shared component uses `theme.palette.primary.main` for link colors instead of hardcoded color values.

## Decisions

- Middleware enforcement chosen over callback-only enforcement
- Email signup keeps current combined flow (account + profile in one form)
- Shared step renderer approach (Approach A) chosen over full shared form component
