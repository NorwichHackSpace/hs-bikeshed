# OAuth Profile Completion & Form Deduplication — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Force OAuth users through the membership form, deduplicate the signup/complete-profile forms into a shared component, and enforce profile+role checks in middleware.

**Architecture:** Extract shared profile form steps (validation, fields, rendering) into `components/auth/MembershipFormSteps.tsx`. Both `/signup` and `/complete-profile` pages import from it. Middleware checks profile and role existence on dashboard routes.

**Tech Stack:** Next.js 16, React 19, MUI, Formik, Yup, Supabase SSR

---

### Task 1: Create shared MembershipFormSteps component

**Files:**
- Create: `components/auth/MembershipFormSteps.tsx`

**Step 1: Create the shared component file**

Create `components/auth/MembershipFormSteps.tsx` with all the shared exports extracted from the current duplicated code. This file exports:

- `ProfileFormValues` type (the interface currently duplicated as `ProfileFormValues` in complete-profile and the profile portion of `SignupFormValues` in signup)
- `PROFILE_STEPS` constant: `['Personal Info', 'Address', 'About You', 'Emergency Contact', 'Agreements']`
- `profileInitialValues` constant: the default values object for all profile fields
- `profileValidationSchema`: the Yup schema for profile fields (steps 1-5 from signup, steps 0-4 from complete-profile — they are identical)
- `profileStepFields`: array of field-name arrays defining which fields are validated per profile step
- `renderProfileStep(stepIndex, formik, options?)`: function that renders the JSX for a given profile step. `options` is `{ email?: string }` — when provided, shows email as a disabled TextField on the Personal Info step.

For link colors in the Agreements step (the `<a>` tags linking to Rules of Engagement and Safety Policies), use `theme.palette.primary.main` via the `useTheme` hook from MUI instead of hardcoded hex values.

Source the content from `app/(auth)/complete-profile/page.tsx` lines 35-130 (validation, steps, fields) and lines 345-789 (renderStepContent cases 0-4). These are identical to signup steps 1-5.

```tsx
'use client'

import {
  Box,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'

export interface ProfileFormValues {
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
  interestsSkills: string
  hadTour: boolean
  hackspaceGoals: string
  shareDetailsWithMembers: 'yes' | 'no' | 'discuss'
  referralSource: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactMobile: string
  emergencyContactLandline: string
  hasMedicalConditions: boolean
  medicalConditionsDetails: string
  acceptedPolicies: boolean
  acceptedSafetyResponsibility: boolean
  isOver18: boolean
  standingOrderConfirmed: boolean
  optInCommunications: boolean
  optInMarketing: boolean
}

export const PROFILE_STEPS = [
  'Personal Info',
  'Address',
  'About You',
  'Emergency Contact',
  'Agreements',
]

export const profileInitialValues: ProfileFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
  interestsSkills: '',
  hadTour: false,
  hackspaceGoals: '',
  shareDetailsWithMembers: 'no',
  referralSource: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactMobile: '',
  emergencyContactLandline: '',
  hasMedicalConditions: false,
  medicalConditionsDetails: '',
  acceptedPolicies: false,
  acceptedSafetyResponsibility: false,
  isOver18: false,
  standingOrderConfirmed: false,
  optInCommunications: false,
  optInMarketing: false,
}

export const profileValidationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone number is required'),
  addressLine1: Yup.string().required('Address is required'),
  addressLine2: Yup.string(),
  city: Yup.string().required('City is required'),
  county: Yup.string().required('County is required'),
  postcode: Yup.string().required('Postcode is required'),
  country: Yup.string().required('Country is required'),
  interestsSkills: Yup.string().required('Please tell us about your interests and skills'),
  hadTour: Yup.boolean(),
  hackspaceGoals: Yup.string().required('Please tell us what you hope to get from the hackspace'),
  shareDetailsWithMembers: Yup.string()
    .oneOf(['yes', 'no', 'discuss'])
    .required('Please select an option'),
  referralSource: Yup.string().required('Please tell us how you heard about us'),
  emergencyContactName: Yup.string().required('Emergency contact name is required'),
  emergencyContactRelationship: Yup.string().required('Relationship is required'),
  emergencyContactMobile: Yup.string().required('Mobile number is required'),
  emergencyContactLandline: Yup.string(),
  hasMedicalConditions: Yup.boolean(),
  medicalConditionsDetails: Yup.string().when('hasMedicalConditions', {
    is: true,
    then: (schema) => schema.required('Please provide details of your medical conditions'),
  }),
  acceptedPolicies: Yup.boolean()
    .oneOf([true], 'You must read and accept the policies')
    .required(),
  acceptedSafetyResponsibility: Yup.boolean()
    .oneOf([true], 'You must accept responsibility for your own safety')
    .required(),
  isOver18: Yup.boolean()
    .oneOf([true], 'You must be over 18 to join')
    .required(),
  standingOrderConfirmed: Yup.boolean()
    .oneOf([true], 'You must set up a standing order')
    .required(),
  optInCommunications: Yup.boolean(),
  optInMarketing: Yup.boolean(),
})

export const profileStepFields: (keyof ProfileFormValues)[][] = [
  ['firstName', 'lastName', 'phone'],
  ['addressLine1', 'city', 'county', 'postcode', 'country'],
  ['interestsSkills', 'hackspaceGoals', 'shareDetailsWithMembers', 'referralSource'],
  ['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactMobile'],
  ['acceptedPolicies', 'acceptedSafetyResponsibility', 'isOver18', 'standingOrderConfirmed'],
]

interface RenderStepOptions {
  email?: string
}

// The formik can have additional fields (like email/password for signup),
// so accept FormikProps of any type that includes ProfileFormValues
export function ProfileStep<T extends ProfileFormValues>({
  stepIndex,
  formik,
  options,
}: {
  stepIndex: number
  formik: FormikProps<T>
  options?: RenderStepOptions
}) {
  const theme = useTheme()
  const linkColor = theme.palette.primary.main

  // ... render switch on stepIndex 0-4
  // Copy the step rendering JSX from complete-profile/page.tsx cases 0-4
  // Replace hardcoded color '#F9B233' in <a> tags with linkColor variable
  // For stepIndex 0 (Personal Info), include the optional email disabled field
}
```

The `ProfileStep` component is a React component (not a function returning JSX) so it can use the `useTheme` hook. Each page uses it like `<ProfileStep stepIndex={activeStep} formik={formik} options={{ email: user?.email }} />`.

**Step 2: Verify it compiles**

Run: `npx next build 2>&1 | head -30` (or `npx tsc --noEmit`)

**Step 3: Commit**

```bash
git add components/auth/MembershipFormSteps.tsx
git commit -m "feat: extract shared MembershipFormSteps component"
```

---

### Task 2: Refactor /complete-profile to use shared component

**Files:**
- Modify: `app/(auth)/complete-profile/page.tsx`

**Step 1: Replace duplicated code with shared imports**

Replace the local `ProfileFormValues` interface, `validationSchema`, `STEPS`, `stepFields`, initial values, and `renderStepContent` cases with imports from the shared component:

```tsx
import {
  ProfileFormValues,
  PROFILE_STEPS,
  profileInitialValues,
  profileValidationSchema,
  profileStepFields,
  ProfileStep,
} from '@/components/auth/MembershipFormSteps'
```

Changes:
- Remove local `STEPS` constant, use `PROFILE_STEPS`
- Remove local `ProfileFormValues` interface
- Remove local `validationSchema`
- Remove local `stepFields`
- Remove local `renderStepContent` function
- Replace `formik.values.firstName` etc. initial values with `...profileInitialValues`
- Replace `{renderStepContent()}` with `<ProfileStep stepIndex={activeStep} formik={formik} options={{ email: user?.email }} />`
- Replace `validationSchema` in useFormik with `profileValidationSchema`
- Replace `stepFields[activeStep]` in validateStep with `profileStepFields[activeStep]`
- Replace `STEPS` references with `PROFILE_STEPS`

The page should shrink from ~883 lines to roughly ~150 lines (useEffect, formik setup, submit handler, stepper/navigation UI, success screen).

**Step 2: Verify it compiles and visually matches**

Run: `npx next build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add app/(auth)/complete-profile/page.tsx
git commit -m "refactor: use shared MembershipFormSteps in complete-profile page"
```

---

### Task 3: Refactor /signup to use shared component

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `stores/authStore.ts`

**Step 1: Update SignupProfileData to use ProfileFormValues**

In `stores/authStore.ts`, replace `SignupProfileData` with a re-export or import from the shared component:

```tsx
import type { ProfileFormValues } from '@/components/auth/MembershipFormSteps'
export type SignupProfileData = ProfileFormValues
```

Remove the existing `SignupProfileData` interface definition (lines 15-42).

**Step 2: Refactor signup page**

In `app/(auth)/signup/page.tsx`:

- Import shared exports:
  ```tsx
  import {
    ProfileFormValues,
    PROFILE_STEPS,
    profileInitialValues,
    profileValidationSchema,
    profileStepFields,
    ProfileStep,
  } from '@/components/auth/MembershipFormSteps'
  ```

- Update `SignupFormValues` to extend `ProfileFormValues`:
  ```tsx
  interface SignupFormValues extends ProfileFormValues {
    email: string
    password: string
    confirmPassword: string
  }
  ```

- Update `STEPS` to prepend 'Account':
  ```tsx
  const STEPS = ['Account', ...PROFILE_STEPS]
  ```

- Update `validationSchema` to extend the shared schema:
  ```tsx
  const validationSchema = profileValidationSchema.concat(
    Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    })
  )
  ```

- Update `stepFields` to prepend account fields:
  ```tsx
  const stepFields: (keyof SignupFormValues)[][] = [
    ['email', 'password', 'confirmPassword'],
    ...profileStepFields,
  ]
  ```

- Update initial values:
  ```tsx
  initialValues: {
    email: '',
    password: '',
    confirmPassword: '',
    ...profileInitialValues,
  },
  ```

- Update `renderStepContent`: case 0 stays as-is (Account step with email/password/confirmPassword fields). Replace cases 1-5 with:
  ```tsx
  default:
    return <ProfileStep stepIndex={activeStep - 1} formik={formik} />
  ```

**Step 3: Verify it compiles**

Run: `npx next build 2>&1 | head -30`

**Step 4: Commit**

```bash
git add app/(auth)/signup/page.tsx stores/authStore.ts
git commit -m "refactor: use shared MembershipFormSteps in signup page"
```

---

### Task 4: Add profile and role checks to middleware

**Files:**
- Modify: `lib/supabase/middleware.ts`

**Step 1: Add profile and role checks**

After the existing `isDashboardRoute && !user` redirect (line 45-49), add checks for authenticated users on dashboard routes:

```tsx
// For authenticated users on dashboard routes, check profile and role completion
if (isDashboardRoute && user) {
  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const url = request.nextUrl.clone()
    url.pathname = '/complete-profile'
    return NextResponse.redirect(url)
  }

  // Check if user has any roles (approved membership)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (!roles || roles.length === 0) {
    const url = request.nextUrl.clone()
    url.pathname = '/pending-approval'
    return NextResponse.redirect(url)
  }
}
```

Also update the `isAuthRoute` check to exclude `/complete-profile` and `/pending-approval` from the "redirect logged-in users away from auth pages" logic, so they don't get bounced to `/equipment` before completing their profile:

```tsx
const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
  request.nextUrl.pathname.startsWith('/signup')

// Don't redirect from complete-profile or pending-approval — user needs to stay there
const isCompletionRoute = request.nextUrl.pathname.startsWith('/complete-profile') ||
  request.nextUrl.pathname.startsWith('/pending-approval')
```

The existing `if (isAuthRoute && user)` redirect stays as-is. The `isCompletionRoute` paths are already not in `isAuthRoute` so they won't be redirected. But double-check: `/complete-profile` doesn't start with `/login` or `/signup`, so it's fine.

**Step 2: Verify it compiles**

Run: `npx next build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: enforce profile and role completion in middleware"
```

---

### Task 5: Manual testing

Test the following flows:

1. **New Google OAuth user**: Sign in with Google → should redirect to `/complete-profile` → fill out form → submit → redirect to `/pending-approval`
2. **Existing Google OAuth user with profile but no role**: Navigate to `/equipment` → should redirect to `/pending-approval`
3. **Existing Google OAuth user with profile and role**: Navigate to `/equipment` → should load normally
4. **New email signup user**: Fill out all 6 steps → submit → confirmation email screen
5. **Navigate to `/equipment` while not logged in**: Should redirect to `/login`
6. **Navigate to `/complete-profile` when profile already exists**: Should redirect to `/equipment` (existing logic in the page's useEffect)

---

### Task 6: Final commit and cleanup

**Step 1: Check for any remaining hardcoded colors**

Search for `#1A73E8` in the codebase — this was the old signup link color. If found in the signup page after refactoring, it should have been replaced by the shared component's theme-based color.

Run: `grep -r '#1A73E8' app/ components/`

**Step 2: Verify final build**

Run: `npx next build`

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup hardcoded colors from signup form"
```
