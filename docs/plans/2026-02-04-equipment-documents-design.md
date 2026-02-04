# Equipment Documents Design

**Date:** 2026-02-04
**Status:** Approved
**Scope:** Phase 1 - Equipment attachments only

---

## Overview

Equipment maintainers can upload and manage documents for their equipment, providing members with easy access to manuals, settings files, safety information, and templates.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Equipment attachments only | Highest value, clearest use case. Project/standalone docs are future work. |
| Visibility | Two-tier (members-only or public) | Covers real use cases without inheritance complexity |
| Permissions | Maintainers + Admins only | Clear ownership, matches equipment responsibility model |
| File types | PDF, images, STL, DXF, SVG | Covers documentation and maker files |
| Size limit | 50MB per file | Practical for STL files and large manuals |
| Relationship | One document per equipment | Simpler than multi-attach; duplicate uploads are fine |
| Organisation | Free-form tags | Flexible for maintainers |

## Data Model

### Database Table: `documents`

```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_size bigint not null,
  mime_type text not null,
  title text not null,
  description text,
  tags text[] default '{}',
  is_public boolean default false,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS Policies

- **SELECT:** Authenticated users see all; anonymous see only `is_public = true`
- **INSERT/UPDATE/DELETE:** User must be admin OR maintainer of linked equipment

### Storage

- **Bucket:** `equipment-documents`
- **Path structure:** `/{equipment_id}/{document_id}/{filename}`
- **Size limit:** 50MB
- **Allowed types:** PDF, JPEG, PNG, GIF, WebP, SVG, STL, DXF

## Component Structure

```
components/features/documents/
├── DocumentList.tsx        # List view with tag filtering
├── DocumentCard.tsx        # Single document display
├── DocumentUpload.tsx      # Upload form with drag-drop
├── DocumentEditDialog.tsx  # Edit metadata dialog
├── DocumentPreview.tsx     # PDF/image preview modal
└── TagFilter.tsx           # Filter documents by tag
```

## Zustand Store

```typescript
interface Document {
  id: string
  equipment_id: string
  filename: string
  storage_path: string
  file_size: number
  mime_type: string
  title: string
  description: string | null
  tags: string[]
  is_public: boolean
  uploaded_by: string
  created_at: string
  updated_at: string
}

interface DocumentStore {
  documents: Document[]
  loading: boolean
  error: string | null

  fetchDocumentsForEquipment: (equipmentId: string) => Promise<void>
  uploadDocument: (equipmentId: string, file: File, metadata: DocumentMetadata) => Promise<void>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
}
```

## User Experience

### Equipment Detail Page

- Documents section displays all attached files
- Filter by tag
- Click to preview (PDF/images) or download (other types)
- Maintainers see upload/edit/delete controls

### Upload Flow

1. Maintainer clicks "Add Document" on equipment detail page
2. Drag-and-drop or browse to select file(s)
3. Enter title, description, tags
4. Choose visibility (members-only or public)
5. Upload and attach to equipment

## Backend Status

| Item | Status |
|------|--------|
| `documents` table | Created |
| RLS policies | Created |
| `equipment-documents` bucket | Created |
| Storage RLS policies | Created |

## Frontend Implementation Tasks

1. Create TypeScript types (`types/documents.ts`)
2. Create Zustand store (`stores/documentStore.ts`)
3. Create DocumentCard component
4. Create DocumentList component
5. Create DocumentUpload component
6. Create DocumentEditDialog component
7. Create DocumentPreview component
8. Create TagFilter component
9. Integrate documents section into equipment detail page
10. Add maintainer permission checks in UI

## Future Enhancements (Out of Scope)

- Project attachments
- Standalone documents
- Multi-entity attachment
- 3D viewer for STL files
- Global document search
