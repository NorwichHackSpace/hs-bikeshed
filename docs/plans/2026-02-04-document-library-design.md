# Document Library Design

**Date:** 2026-02-04
**Status:** Approved
**Scope:** Central document library with linking to equipment and projects

---

## Overview

Documents are first-class entities in a central library. Any member can upload documents, and they can be linked to equipment and projects by those with edit permissions. This replaces the previous direct-attachment model.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Central library with linking | More flexible than direct attachment; documents can be reused |
| Upload permissions | All members | Trust-based, fits hackspace culture |
| Link permissions | Same as edit | Maintainers link to equipment, project owners link to projects |
| Visibility | Document-level | Uploader decides if doc is public or members-only |
| Library view | All documents | Full searchable archive with filters |
| Route | `/documents` | Top-level nav, documents are a core feature |

## Data Model

### Modified Table: `documents`

```sql
-- Remove equipment_id requirement (keep column for migration, then drop)
ALTER TABLE documents ALTER COLUMN equipment_id DROP NOT NULL;

-- After migration completes, drop the column entirely
ALTER TABLE documents DROP COLUMN equipment_id;
```

### New Table: `document_equipment_links`

```sql
CREATE TABLE public.document_equipment_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, equipment_id)
);
```

### New Table: `document_project_links`

```sql
CREATE TABLE public.document_project_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, project_id)
);
```

### Storage Path Change

- **Old:** `/{equipment_id}/{document_id}/{filename}`
- **New:** `/{document_id}/{filename}`

## RLS Policies

### Documents Table

| Operation | Policy |
|-----------|--------|
| SELECT | Authenticated: all rows; Anonymous: `is_public = true` only |
| INSERT | Any authenticated user |
| UPDATE | Uploader OR admin |
| DELETE | Uploader OR admin |

### Document-Equipment Links

| Operation | Policy |
|-----------|--------|
| SELECT | Follow document visibility |
| INSERT | Admin OR maintainer of equipment |
| DELETE | Admin OR maintainer of equipment |

### Document-Project Links

| Operation | Policy |
|-----------|--------|
| SELECT | Follow document visibility |
| INSERT | Admin OR project owner |
| DELETE | Admin OR project owner |

## Component Structure

```
components/features/documents/
├── DocumentCard.tsx              # Single document display (update to show link counts)
├── DocumentUpload.tsx            # Upload dialog (remove equipment requirement)
├── DocumentEditDialog.tsx        # Edit metadata dialog (existing)
├── DocumentPreview.tsx           # PDF/image preview (existing)
├── DocumentList.tsx              # List view (update for linked mode)
├── DocumentLibrary.tsx           # NEW: Full library page component
├── DocumentLinkAutocomplete.tsx  # NEW: Autocomplete for linking
└── index.ts
```

## User Experience

### Document Library Page (`/documents`)

- Header with "Documents" title and "Upload Document" button
- Search bar for title/description
- Filter chips: tags, file type, visibility, linked status
- Grid of DocumentCards
- Each card shows linked equipment/projects count
- Click card to preview, menu for edit/delete/download

### Equipment Detail Page (modified)

- Documents section shows linked documents
- "Link Document" button for maintainers → opens autocomplete modal
- Can unlink documents (doesn't delete the document)
- No more direct upload on this page

### Project Detail Page (new section)

- New "Documents" section
- Same linking UI as equipment
- Project owners can link/unlink

### Upload Flow

1. Member navigates to `/documents`
2. Clicks "Upload Document"
3. Drag-drop or browse to select file
4. Enter title, description, tags, visibility
5. Document saved to library (initially unlinked)
6. Member can immediately link to equipment/projects, or leave for later

## Migration Plan

1. Create junction tables with RLS
2. Migrate existing document-equipment relationships to `document_equipment_links`
3. Update storage paths (move files)
4. Drop `equipment_id` column from documents
5. Update frontend components

## Frontend Implementation Tasks

1. Create database migration (junction tables, RLS)
2. Migrate existing data
3. Update TypeScript types
4. Update Zustand store (add linking methods)
5. Create DocumentLibrary component
6. Create DocumentLinkAutocomplete component
7. Update DocumentCard (show link counts)
8. Update DocumentUpload (remove equipment requirement)
9. Update DocumentList (support linked mode)
10. Create `/documents` page
11. Update equipment detail page (linking UI)
12. Add documents section to project pages

## Future Enhancements (Out of Scope)

- Bulk linking/unlinking
- Document versioning
- Folder organization
- Full-text search within documents
