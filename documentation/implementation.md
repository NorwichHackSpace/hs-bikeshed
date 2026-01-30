# BikeShed Implementation Documentation

This document details the full implementation of each feature in the BikeShed application - the Norwich Hackspace Member Portal.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Equipment Management](#equipment-management)
- [Bookings](#bookings)
- [Form State Management](#form-state-management)
- [UI/Design System](#uidesign-system)
- [File Storage](#file-storage)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Library | Material UI (MUI) v6 |
| Application State | Zustand |
| Form State | Formik + Yup |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Package Manager | pnpm |

### Project Structure

```
nhs-bikeshed/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth route group (login, signup)
│   └── (dashboard)/       # Dashboard route group (equipment, bookings, etc.)
├── components/
│   ├── features/          # Feature-specific components
│   └── ui/                # Reusable UI components
├── lib/
│   └── supabase/          # Supabase client configuration
├── stores/                # Zustand state stores
├── theme/                 # MUI theme configuration
├── types/                 # TypeScript type definitions
└── documentation/         # Project documentation
```

---

## Database Schema

### Enums

```sql
-- Membership status for user profiles
CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'lapsed');

-- Equipment operational status
CREATE TYPE equipment_status AS ENUM ('operational', 'out_of_service', 'retired');

-- User roles for access control
CREATE TYPE user_role AS ENUM ('member', 'equipment_maintainer', 'administrator');
```

### Core Tables

#### profiles
Extends Supabase auth.users with hackspace-specific data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| name | text | Display name (required) |
| email | text | Email address |
| phone | text | Contact number |
| membership_status | membership_status | Current membership state |
| join_date | date | When member joined |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

#### equipment
Stores all hackspace equipment and tools.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Equipment name (required) |
| model | text | Make/model information |
| category | text | Category (e.g., "3D Printing", "Woodworking") |
| description | text | Detailed description |
| status | equipment_status | Operational status |
| induction_required | boolean | Whether induction needed to use |
| risk_level | text | Risk classification (Low/Medium/High) |
| metadata | jsonb | Technical specifications as JSON |
| images | text[] | Array of storage paths for images |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

#### equipment_maintainers
Junction table linking equipment to maintainer users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| equipment_id | uuid | References equipment |
| user_id | uuid | References profiles (maintainer) |
| assigned_by | uuid | References profiles (who assigned) |
| assigned_at | timestamptz | When assigned |

#### bookings
Equipment booking/reservation records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| equipment_id | uuid | References equipment |
| user_id | uuid | References profiles |
| start_time | timestamptz | Booking start |
| end_time | timestamptz | Booking end |
| notes | text | Booking notes |

#### inductions
Records of completed equipment inductions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| equipment_id | uuid | References equipment |
| user_id | uuid | User who was inducted |
| inducted_by | uuid | User who performed induction |
| inducted_at | timestamptz | When induction occurred |
| notes | text | Induction notes |

#### induction_requests
Pending requests for equipment inductions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| equipment_id | uuid | References equipment |
| user_id | uuid | User requesting induction |
| status | text | Request status |
| notes | text | Request notes |
| requested_at | timestamptz | When requested |

#### projects
Member project documentation.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles (owner) |
| title | text | Project title |
| description | text | Project description |

#### user_roles
Role assignments for access control.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles |
| role | user_role | Assigned role |
| assigned_by | uuid | Who assigned the role |
| assigned_at | timestamptz | When assigned |

### Helper Functions

```sql
-- Check if current user has a specific role
has_role(check_role user_role) RETURNS boolean

-- Check if current user is an administrator
is_admin() RETURNS boolean

-- Check if current user is a maintainer of specific equipment
is_maintainer_of(equip_id uuid) RETURNS boolean

-- Check if current user is inducted on specific equipment
is_inducted_on(equip_id uuid) RETURNS boolean
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **profiles**: Users can read all, update own profile
- **equipment**: All authenticated users can read/create/update
- **bookings**: Users can manage own bookings, read all
- **inductions**: Users can read own, maintainers/admins can manage
- **user_roles**: Admins can manage, users can read own

---

## Authentication

### Implementation

Authentication uses Supabase Auth with the following methods:

1. **Email/Password** - Traditional signup with email confirmation
2. **Google OAuth** - Social login via Google

### Auth Store (`stores/authStore.ts`)

```typescript
interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  error: string | null

  // Methods
  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: () => boolean
}
```

### Auth Flow

1. `AuthProvider` component wraps dashboard routes
2. On mount, calls `initialize()` to check existing session
3. If session exists, fetches user profile from `profiles` table
4. Subscribes to auth state changes for real-time updates

### Profile Creation

When a user signs up:
1. Supabase creates auth.users record
2. Database trigger creates corresponding profiles record
3. Profile is populated with name from signup form

---

## Equipment Management

### Overview

Equipment management allows members to:
- View all hackspace equipment
- Add new equipment items
- Edit existing equipment
- Upload images for equipment
- View technical specifications

### Data Model

The `metadata` JSONB field stores flexible specifications:

```json
{
  "technology": "FDM",
  "build_volume": "256 × 256 × 256mm",
  "max_speed": "500mm/s",
  "materials": "PLA, PETG, ABS, ASA, PA, PC, TPU",
  "heated_bed": true,
  "max_bed_temp": "110°C",
  "max_nozzle_temp": "300°C",
  "enclosure": true,
  "accessories": "Bambu Lab AMS 2 Pro",
  "training_level": "Orange",
  "software": "Bambu Studio"
}
```

### Equipment Store (`stores/equipmentStore.ts`)

```typescript
interface EquipmentState {
  equipment: EquipmentWithMaintainers[]
  loading: boolean
  error: string | null

  fetchEquipment: () => Promise<void>
  createEquipment: (data: EquipmentInsert) => Promise<void>
  updateEquipment: (id: string, data: EquipmentUpdate) => Promise<void>
}
```

### Components

#### EquipmentDialog (`components/features/EquipmentDialog.tsx`)

Modal dialog for adding/editing equipment with fields:
- Name (required)
- Model
- Category (dropdown)
- Description (multiline)
- Risk Level (Low/Medium/High)
- Induction Required (toggle)
- Status (for editing only)
- Specifications (JSON editor)
- Images (drag-drop upload)

#### ImageUpload (`components/features/ImageUpload.tsx`)

Drag-and-drop image upload component:
- Accepts multiple images
- Uploads directly to Supabase Storage
- Shows thumbnail preview grid
- Delete functionality for each image
- Supports JPG, PNG, GIF, WebP

### Equipment Page (`app/(dashboard)/equipment/page.tsx`)

Grid display of equipment cards showing:
- Thumbnail image (if available)
- Equipment name
- Model (if available)
- Category chip
- Status chip (operational/out_of_service/retired)
- Description (truncated to 2 lines)
- Risk level chip
- Induction required indicator
- Image count badge ("+X" if multiple images)

### Categories

Predefined equipment categories:
- Laser Cutting
- 3D Printing
- Woodworking
- Metalworking
- Electronics
- Textiles
- CNC
- Hand Tools
- Other

Each category has an associated emoji icon for visual identification.

### Current Equipment

Equipment has been imported from the Norwich Hackspace wiki:

**3D Printers (8 items):**
| Name | Model | Status |
|------|-------|--------|
| Ender 3 | Creality Ender 3 | Operational |
| CR-10 | Creality CR-10 | Operational |
| Phrozen Sonic Mini 4K | Phrozen Sonic Mini 4K | Operational |
| Phrozen Sonic Mighty 4K | Phrozen Sonic Mighty 4K | Operational |
| Wanhao D7 | Wanhao Duplicator 7 | Out of Service |
| Ultimaker 2 | Ultimaker 2 | Retired |
| Heir | Bambu Lab P1S | Operational |
| King | Bambu Lab P1S | Operational |

**Workshop Equipment (11 items):**
| Name | Model | Risk Level |
|------|-------|------------|
| Table Saw | DeWalt DWE7492-GB | High |
| CNC Router | Custom Build | High |
| Wood Lathe | Apollo Woodpecker | High |
| Chop Saw | Evolution R255SMS | High |
| Planer/Thicknesser | Triton TTB579PLN | Medium |
| Pillar Drill | Axminster ED16B2 | Medium |
| Belt/Disc Sander | Sealey SM15 | Medium |
| Mortiser | Jet 200321 | Medium |
| Kity Bandsaw | Kity 613 | Medium |
| Triton Bandsaw | Triton TTB705BDS | Medium |
| Router Table | Makita Palm Router | Medium |

**Laser Cutters (3 items):**
| Name | Model | Status | Specs |
|------|-------|--------|-------|
| Greyfin A2 Laser Cutter | Greyfin A2 | Operational | 60W CO2, 600×400mm bed |
| Russian A0 Laser Cutter | Russian A0 | Out of Service | 90-100W CO2, 1200×900mm bed |
| Fibre Laser Marker | Fibre Laser 60W | Operational | 60W Fibre, 300×300mm |

---

## Bookings

### Overview

The booking system allows members to reserve equipment that requires booking before use. Only equipment with `require_booking = true` appears in the booking form.

### Data Model

```typescript
interface Booking {
  id: string
  equipment_id: string      // References equipment
  user_id: string           // References profiles (auto-set to current user)
  start_time: string        // ISO timestamp
  end_time: string          // ISO timestamp
  notes: string | null      // Optional booking notes
  created_at: string
  updated_at: string
}
```

### Booking Store (`stores/bookingStore.ts`)

```typescript
interface BookingState {
  bookings: BookingWithDetails[]      // All bookings (for calendar)
  myBookings: BookingWithDetails[]    // Current user's bookings
  loading: boolean
  error: string | null

  fetchBookings: (equipmentId?: string) => Promise<void>
  fetchMyBookings: () => Promise<void>
  createBooking: (booking: BookingInput) => Promise<void>
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
}
```

### Components

#### BookingCalendar (`components/features/BookingCalendar.tsx`)

Month-view calendar component:
- Navigate between months with arrow buttons
- "Today" button to jump to current date
- Shows bookings as colored chips on each day
- Click on a day to create a new booking
- Click on a booking chip to edit it
- Groups bookings by date
- Shows "+X more" when a day has many bookings

#### BookingDialog (`components/features/BookingDialog.tsx`)

Form dialog for creating/editing bookings using Formik:
- Equipment autocomplete (grouped by category, searchable)
- Date picker
- Start/End time dropdowns (15-minute increments)
- Notes field
- Validation (equipment required, end time after start time)
- Delete button when editing

### Bookings Page (`app/(dashboard)/bookings/page.tsx`)

Two view modes:
1. **Calendar View** - Full month calendar showing all bookings
2. **List View** - User's upcoming and past bookings

Features:
- Toggle between Calendar and List views
- "New Booking" button
- Click any day in calendar to create booking
- Click any booking to edit/delete

### Time Slots

Bookings use 15-minute increments from 00:00 to 23:45:
```typescript
const TIME_SLOTS = ['00:00', '00:15', '00:30', '00:45', '01:00', ...]
```

---

## Form State Management

### Architecture

The application uses a two-tier state management approach:

| State Type | Technology | Purpose |
|------------|------------|---------|
| Application State | Zustand | Shared data (equipment list, bookings, auth) |
| Form State | Formik + Yup | Form inputs, validation, submission |

### Why This Pattern?

- **Zustand** handles data that needs to be shared across components and persisted
- **Formik** handles transient form state that's local to a single component
- **Yup** provides declarative validation schemas

### Formik Implementation

All form dialogs use Formik with this pattern:

```typescript
import { useFormik } from 'formik'
import * as Yup from 'yup'

// 1. Define validation schema
const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Required'),
})

// 2. Define form values type
interface FormValues {
  name: string
  email: string
}

// 3. Initialize Formik
const formik = useFormik<FormValues>({
  initialValues: { name: '', email: '' },
  validationSchema,
  onSubmit: async (values, { setSubmitting, setStatus }) => {
    try {
      await saveToZustandStore(values)
      onClose()
    } catch (err) {
      setStatus({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  },
})

// 4. Reset form when dialog opens with existing data
useEffect(() => {
  if (existingData) {
    formik.resetForm({ values: mapDataToFormValues(existingData) })
  }
}, [existingData, open])
```

### Form Components Using Formik

#### EquipmentDialog

Validation schema:
```typescript
const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  model: Yup.string(),
  category: Yup.string(),
  description: Yup.string(),
  riskLevel: Yup.string(),
  inductionRequired: Yup.boolean(),
  requireBooking: Yup.boolean(),
  status: Yup.string(),
  metadata: Yup.string().test('is-valid-json', 'Must be valid JSON', (value) => {
    if (!value?.trim()) return true
    try { JSON.parse(value); return true } catch { return false }
  }),
  images: Yup.array().of(Yup.string()),
})
```

#### BookingDialog

Validation schema:
```typescript
const validationSchema = Yup.object({
  equipment: Yup.object().nullable().required('Equipment is required'),
  date: Yup.string().required('Date is required'),
  startTime: Yup.string().required('Start time is required'),
  endTime: Yup.string()
    .required('End time is required')
    .test('is-after-start', 'End time must be after start time', function(value) {
      const { startTime } = this.parent
      return !startTime || !value || value > startTime
    }),
  notes: Yup.string(),
})
```

### Connecting Formik to MUI Components

Standard text field:
```tsx
<TextField
  name="name"
  value={formik.values.name}
  onChange={formik.handleChange}
  onBlur={formik.handleBlur}
  error={formik.touched.name && Boolean(formik.errors.name)}
  helperText={formik.touched.name && formik.errors.name}
/>
```

Switch/checkbox:
```tsx
<Switch
  name="requireBooking"
  checked={formik.values.requireBooking}
  onChange={formik.handleChange}
/>
```

Autocomplete (custom value handling):
```tsx
<Autocomplete
  value={formik.values.equipment}
  onChange={(_, newValue) => formik.setFieldValue('equipment', newValue)}
  // ... other props
/>
```

---

## UI/Design System

### Theme

Based on "Soft UI" design principles with the following characteristics:

#### Colors

```typescript
const palette = {
  primary: {
    main: '#1A73E8',      // Blue
    light: '#4791db',
    dark: '#115293',
  },
  secondary: {
    main: '#7928CA',      // Purple
    light: '#9c4dcc',
    dark: '#5a1e96',
  },
  hackspaceYellow: {
    main: '#F9B233',      // Norwich Hackspace brand yellow
    light: '#FBCA6A',
    dark: '#D99A1F',
  },
  success: { main: '#17AD37' },
  warning: { main: '#FFA726' },
  error: { main: '#EA0606' },
  background: {
    default: '#f0f2f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#344767',
    secondary: '#7b809a',
  },
}
```

#### Typography

- Font Family: IBM Plex Sans
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Heading scale: h1 (2.25rem) → h6 (0.875rem)

#### Components

- **Border Radius**: 12px (cards), 8px (buttons, inputs)
- **Shadows**: Soft, subtle shadows for depth
- **Buttons**: Gradient backgrounds, hover lift effect
- **Cards**: Rounded corners, subtle shadows, hover animations
- **Navigation**: Dark gradient sidebar (#1a1f37 → #0f1225)

### Navigation (`components/ui/Navigation.tsx`)

Sidebar navigation with:
- Norwich Hackspace logo
- BikeShed branding
- Navigation links with icons
- User profile card at bottom
- Mobile-responsive drawer
- Top app bar with user menu

### Branding

- **Logo**: Norwich Hackspace roundel (`public/Norwich_hackspace_roundel-135x135.png`)
- **Brand Yellow**: #F9B233 (sampled from logo)
- **App Name**: BikeShed

---

## File Storage

### Supabase Storage Configuration

**Bucket**: `equipment-images`
- Public access for viewing
- Authenticated upload/delete

### Storage Policies

```sql
-- Anyone can view equipment images (public bucket)
CREATE POLICY "Anyone can view equipment images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'equipment-images');

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload equipment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipment-images');

-- Authenticated users can delete images
CREATE POLICY "Authenticated users can delete equipment images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'equipment-images');
```

### Image URL Format

```
https://<project-ref>.supabase.co/storage/v1/object/public/equipment-images/<filename>
```

### File Naming Convention

Images are stored with the pattern:
- User uploads: `<equipment-id>-<timestamp>-<random>.ext`
- Wiki imports: `workshop-<original-filename>`

---

## Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Future Features

Planned features not yet implemented:
- Bookings management
- Inductions tracking and requests
- Projects showcase
- Admin dashboard
- Member directory
- Equipment maintenance logs
- Notification system
