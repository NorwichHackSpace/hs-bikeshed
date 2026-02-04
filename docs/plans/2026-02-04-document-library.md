# Document Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace equipment-attached documents with a central document library supporting linking to equipment and projects.

**Architecture:** Documents become standalone entities in a central library. Junction tables (`document_equipment_links`, `document_project_links`) connect documents to equipment/projects. Any member can upload; linking follows edit permissions.

**Tech Stack:** Next.js 16, TypeScript, MUI, Zustand, Supabase (Postgres + Storage + RLS)

---

## Task 1: Database Migration - Junction Tables and Schema Changes

**Files:**
- Create: Database migration via Supabase MCP

**Step 1: Create junction tables and update documents table**

Run the following migration using the Supabase MCP `apply_migration` tool:

```sql
-- Create document-equipment junction table
CREATE TABLE public.document_equipment_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, equipment_id)
);

-- Create document-project junction table
CREATE TABLE public.document_project_links (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  linked_by UUID NOT NULL REFERENCES public.profiles(id),
  linked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, project_id)
);

-- Make equipment_id nullable on documents (for standalone docs)
ALTER TABLE public.documents ALTER COLUMN equipment_id DROP NOT NULL;

-- Add updated_at trigger to junction tables
CREATE TRIGGER update_document_equipment_links_updated_at
  BEFORE UPDATE ON public.document_equipment_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_project_links_updated_at
  BEFORE UPDATE ON public.document_project_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Verify migration applied**

Use `list_tables` to confirm new tables exist.

**Step 3: Commit**

```bash
git add -A && git commit -m "db: add document junction tables and make equipment_id nullable"
```

---

## Task 2: RLS Policies for Junction Tables

**Files:**
- Create: Database policies via Supabase MCP

**Step 1: Create RLS policies for document_equipment_links**

```sql
-- Enable RLS
ALTER TABLE public.document_equipment_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can see links (visibility controlled at document level)
CREATE POLICY "Anyone can view document equipment links"
  ON public.document_equipment_links FOR SELECT
  USING (true);

-- INSERT: Maintainers of equipment or admins
CREATE POLICY "Maintainers and admins can link documents to equipment"
  ON public.document_equipment_links FOR INSERT
  WITH CHECK (
    is_admin() OR is_maintainer_of(equipment_id)
  );

-- DELETE: Maintainers of equipment or admins
CREATE POLICY "Maintainers and admins can unlink documents from equipment"
  ON public.document_equipment_links FOR DELETE
  USING (
    is_admin() OR is_maintainer_of(equipment_id)
  );
```

**Step 2: Create RLS policies for document_project_links**

```sql
-- Enable RLS
ALTER TABLE public.document_project_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can see links
CREATE POLICY "Anyone can view document project links"
  ON public.document_project_links FOR SELECT
  USING (true);

-- INSERT: Project owner or admin
CREATE POLICY "Project owners and admins can link documents"
  ON public.document_project_links FOR INSERT
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- DELETE: Project owner or admin
CREATE POLICY "Project owners and admins can unlink documents"
  ON public.document_project_links FOR DELETE
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND user_id = auth.uid()
    )
  );
```

**Step 3: Update documents table policies**

```sql
-- Drop old INSERT policy that required maintainer
DROP POLICY IF EXISTS "Maintainers and admins can create documents" ON public.documents;

-- New INSERT policy: any authenticated user
CREATE POLICY "Authenticated users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Drop old UPDATE policy
DROP POLICY IF EXISTS "Maintainers and admins can update documents" ON public.documents;

-- New UPDATE policy: uploader or admin
CREATE POLICY "Uploaders and admins can update documents"
  ON public.documents FOR UPDATE
  USING (uploaded_by = auth.uid() OR is_admin());

-- Drop old DELETE policy
DROP POLICY IF EXISTS "Maintainers and admins can delete documents" ON public.documents;

-- New DELETE policy: uploader or admin
CREATE POLICY "Uploaders and admins can delete documents"
  ON public.documents FOR DELETE
  USING (uploaded_by = auth.uid() OR is_admin());
```

**Step 4: Verify policies**

Use `get_advisors` with type "security" to check for issues.

**Step 5: Commit**

```bash
git add -A && git commit -m "db: add RLS policies for document linking"
```

---

## Task 3: Migrate Existing Data

**Files:**
- Create: Data migration via Supabase MCP

**Step 1: Migrate existing document-equipment relationships**

```sql
-- Copy existing equipment_id relationships to junction table
INSERT INTO public.document_equipment_links (document_id, equipment_id, linked_by, linked_at)
SELECT id, equipment_id, uploaded_by, created_at
FROM public.documents
WHERE equipment_id IS NOT NULL;
```

**Step 2: Verify migration**

```sql
SELECT COUNT(*) as doc_count FROM documents WHERE equipment_id IS NOT NULL;
SELECT COUNT(*) as link_count FROM document_equipment_links;
-- These should match
```

**Step 3: Commit**

```bash
git add -A && git commit -m "db: migrate existing document-equipment relationships to junction table"
```

---

## Task 4: Update TypeScript Types

**Files:**
- Modify: `types/database.ts`

**Step 1: Add junction table types and update Document type**

Add after the `documents` table definition in the Tables section:

```typescript
document_equipment_links: {
  Row: {
    document_id: string
    equipment_id: string
    linked_by: string
    linked_at: string
  }
  Insert: {
    document_id: string
    equipment_id: string
    linked_by: string
    linked_at?: string
  }
  Update: {
    document_id?: string
    equipment_id?: string
    linked_by?: string
    linked_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "document_equipment_links_document_id_fkey"
      columns: ["document_id"]
      isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "document_equipment_links_equipment_id_fkey"
      columns: ["equipment_id"]
      isOneToOne: false
      referencedRelation: "equipment"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "document_equipment_links_linked_by_fkey"
      columns: ["linked_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
document_project_links: {
  Row: {
    document_id: string
    project_id: string
    linked_by: string
    linked_at: string
  }
  Insert: {
    document_id: string
    project_id: string
    linked_by: string
    linked_at?: string
  }
  Update: {
    document_id?: string
    project_id?: string
    linked_by?: string
    linked_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "document_project_links_document_id_fkey"
      columns: ["document_id"]
      isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "document_project_links_project_id_fkey"
      columns: ["project_id"]
      isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "document_project_links_linked_by_fkey"
      columns: ["linked_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
  ]
}
```

**Step 2: Update Document Row type to make equipment_id optional**

Change in documents table:
```typescript
equipment_id: string | null  // was: string
```

**Step 3: Add convenience types at bottom of file**

```typescript
export type DocumentEquipmentLink = Database["public"]["Tables"]["document_equipment_links"]["Row"]
export type DocumentProjectLink = Database["public"]["Tables"]["document_project_links"]["Row"]

// Document with link counts for library view
export interface DocumentWithLinkCounts extends Document {
  equipment_count?: number
  project_count?: number
}
```

**Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add types/database.ts && git commit -m "feat: add document linking types"
```

---

## Task 5: Update Document Store

**Files:**
- Modify: `stores/documentStore.ts`

**Step 1: Update the store to support standalone documents and linking**

Replace the entire file with:

```typescript
import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Document, DocumentWithLinkCounts } from '@/types/database'

interface DocumentMetadata {
  title: string
  description?: string
  tags: string[]
  is_public: boolean
}

interface DocumentState {
  documents: DocumentWithLinkCounts[]
  linkedDocuments: Document[]
  loading: boolean
  uploading: boolean
  error: string | null
}

interface DocumentActions {
  // Library operations
  fetchAllDocuments: () => Promise<void>
  uploadDocument: (file: File, metadata: DocumentMetadata) => Promise<Document>
  updateDocument: (id: string, updates: Partial<DocumentMetadata>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>

  // Equipment linking
  fetchDocumentsForEquipment: (equipmentId: string) => Promise<void>
  linkDocumentToEquipment: (documentId: string, equipmentId: string) => Promise<void>
  unlinkDocumentFromEquipment: (documentId: string, equipmentId: string) => Promise<void>

  // Project linking
  fetchDocumentsForProject: (projectId: string) => Promise<void>
  linkDocumentToProject: (documentId: string, projectId: string) => Promise<void>
  unlinkDocumentFromProject: (documentId: string, projectId: string) => Promise<void>

  // Search for autocomplete
  searchDocuments: (query: string) => Promise<Document[]>

  clearDocuments: () => void
  clearLinkedDocuments: () => void
}

type DocumentStore = DocumentState & DocumentActions

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  linkedDocuments: [],
  loading: false,
  uploading: false,
  error: null,

  fetchAllDocuments: async () => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      // Fetch documents with link counts
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_equipment_links(count),
          document_project_links(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const docsWithCounts = (data ?? []).map(doc => ({
        ...doc,
        equipment_count: doc.document_equipment_links?.[0]?.count ?? 0,
        project_count: doc.document_project_links?.[0]?.count ?? 0,
      }))

      set({ documents: docsWithCounts })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchDocumentsForEquipment: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('document_equipment_links')
        .select('documents(*)')
        .eq('equipment_id', equipmentId)

      if (error) throw error

      const docs = (data ?? [])
        .map(link => link.documents)
        .filter((doc): doc is Document => doc !== null)

      set({ linkedDocuments: docs })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchDocumentsForProject: async (projectId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('document_project_links')
        .select('documents(*)')
        .eq('project_id', projectId)

      if (error) throw error

      const docs = (data ?? [])
        .map(link => link.documents)
        .filter((doc): doc is Document => doc !== null)

      set({ linkedDocuments: docs })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  uploadDocument: async (file, metadata) => {
    const supabase = getClient()
    set({ uploading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const documentId = crypto.randomUUID()
      const storagePath = `${documentId}/${file.name}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('equipment-documents')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      // Create document record (no equipment_id)
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          equipment_id: null,
          filename: file.name,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          title: metadata.title || file.name,
          description: metadata.description || null,
          tags: metadata.tags,
          is_public: metadata.is_public,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage.from('equipment-documents').remove([storagePath])
        throw insertError
      }

      // Refresh library
      await get().fetchAllDocuments()
      return data
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ uploading: false })
    }
  },

  updateDocument: async (id, updates) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set({
        documents: get().documents.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        ),
        linkedDocuments: get().linkedDocuments.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        ),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteDocument: async (id) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const doc = get().documents.find(d => d.id === id) ??
                  get().linkedDocuments.find(d => d.id === id)
      if (!doc) throw new Error('Document not found')

      const { error: storageError } = await supabase.storage
        .from('equipment-documents')
        .remove([doc.storage_path])

      if (storageError) console.warn('Storage delete failed:', storageError)

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      set({
        documents: get().documents.filter(d => d.id !== id),
        linkedDocuments: get().linkedDocuments.filter(d => d.id !== id),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  linkDocumentToEquipment: async (documentId, equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('document_equipment_links')
        .insert({
          document_id: documentId,
          equipment_id: equipmentId,
          linked_by: user.id,
        })

      if (error) throw error

      // Refresh linked documents
      await get().fetchDocumentsForEquipment(equipmentId)
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  unlinkDocumentFromEquipment: async (documentId, equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('document_equipment_links')
        .delete()
        .eq('document_id', documentId)
        .eq('equipment_id', equipmentId)

      if (error) throw error

      set({
        linkedDocuments: get().linkedDocuments.filter(d => d.id !== documentId),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  linkDocumentToProject: async (documentId, projectId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('document_project_links')
        .insert({
          document_id: documentId,
          project_id: projectId,
          linked_by: user.id,
        })

      if (error) throw error

      await get().fetchDocumentsForProject(projectId)
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  unlinkDocumentFromProject: async (documentId, projectId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { error } = await supabase
        .from('document_project_links')
        .delete()
        .eq('document_id', documentId)
        .eq('project_id', projectId)

      if (error) throw error

      set({
        linkedDocuments: get().linkedDocuments.filter(d => d.id !== documentId),
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  searchDocuments: async (query) => {
    const supabase = getClient()

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10)

      if (error) throw error
      return data ?? []
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  },

  clearDocuments: () => {
    set({ documents: [], error: null })
  },

  clearLinkedDocuments: () => {
    set({ linkedDocuments: [], error: null })
  },
}))
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add stores/documentStore.ts && git commit -m "feat: update document store for library and linking"
```

---

## Task 6: Update DocumentUpload Component

**Files:**
- Modify: `components/features/documents/DocumentUpload.tsx`

**Step 1: Remove equipmentId requirement**

Update the interface and component to not require equipmentId:

```typescript
interface DocumentUploadProps {
  open: boolean
  onClose: () => void
  onUploaded?: (document: Document) => void
}
```

Update the component call to use the new store method:

```typescript
// In onSubmit:
const doc = await uploadDocument(file, {
  title: values.title,
  description: values.description || undefined,
  tags: values.tags,
  is_public: values.is_public,
})
if (onUploaded) onUploaded(doc)
handleClose()
```

Remove `equipmentId` from all references.

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/features/documents/DocumentUpload.tsx && git commit -m "feat: make document upload standalone"
```

---

## Task 7: Create DocumentLinkAutocomplete Component

**Files:**
- Create: `components/features/documents/DocumentLinkAutocomplete.tsx`

**Step 1: Create the autocomplete component**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material'
import { useDocumentStore } from '@/stores'
import type { Document } from '@/types/database'

interface DocumentLinkAutocompleteProps {
  open: boolean
  onClose: () => void
  onLink: (document: Document) => Promise<void>
  excludeDocumentIds?: string[]
  title?: string
}

export function DocumentLinkAutocomplete({
  open,
  onClose,
  onLink,
  excludeDocumentIds = [],
  title = 'Link Document',
}: DocumentLinkAutocompleteProps) {
  const { searchDocuments } = useDocumentStore()
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [linking, setLinking] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const results = await searchDocuments(query)
      setOptions(results.filter(doc => !excludeDocumentIds.includes(doc.id)))
    } finally {
      setLoading(false)
    }
  }, [searchDocuments, excludeDocumentIds])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(inputValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue, handleSearch])

  const handleLink = async () => {
    if (!selectedDoc) return

    setLinking(true)
    try {
      await onLink(selectedDoc)
      setSelectedDoc(null)
      setInputValue('')
      onClose()
    } finally {
      setLinking(false)
    }
  }

  const handleClose = () => {
    setSelectedDoc(null)
    setInputValue('')
    setOptions([])
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Autocomplete
          value={selectedDoc}
          onChange={(_, newValue) => setSelectedDoc(newValue)}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          options={options}
          loading={loading}
          getOptionLabel={(option) => option.title}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  {option.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={option.mime_type.split('/')[1]?.toUpperCase() ?? 'FILE'}
                    size="small"
                    variant="outlined"
                  />
                  {option.tags.slice(0, 2).map(tag => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search documents"
              placeholder="Type to search..."
              helperText="Search by title or description"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={linking}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleLink}
          disabled={!selectedDoc || linking}
        >
          {linking ? 'Linking...' : 'Link'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

**Step 2: Export from index**

Add to `components/features/documents/index.ts`:

```typescript
export { DocumentLinkAutocomplete } from './DocumentLinkAutocomplete'
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/features/documents/DocumentLinkAutocomplete.tsx components/features/documents/index.ts && git commit -m "feat: add document link autocomplete component"
```

---

## Task 8: Update DocumentList for Linking Mode

**Files:**
- Modify: `components/features/documents/DocumentList.tsx`

**Step 1: Update to support linked documents mode**

Update the component to work with `linkedDocuments` from the store and add linking/unlinking UI:

```typescript
'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LinkIcon from '@mui/icons-material/Link'
import { useDocumentStore } from '@/stores'
import { DocumentCard } from './DocumentCard'
import { DocumentUpload } from './DocumentUpload'
import { DocumentEditDialog } from './DocumentEditDialog'
import { DocumentPreview } from './DocumentPreview'
import { DocumentLinkAutocomplete } from './DocumentLinkAutocomplete'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

interface DocumentListProps {
  equipmentId?: string
  projectId?: string
  canManage: boolean
}

export function DocumentList({ equipmentId, projectId, canManage }: DocumentListProps) {
  const {
    linkedDocuments,
    loading,
    error,
    unlinkDocumentFromEquipment,
    unlinkDocumentFromProject,
    linkDocumentToEquipment,
    linkDocumentToProject,
  } = useDocumentStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const documents = linkedDocuments

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [documents])

  const filteredDocuments = useMemo(() => {
    if (!selectedTag) return documents
    return documents.filter((doc) => doc.tags.includes(selectedTag))
  }, [documents, selectedTag])

  const getDownloadUrl = useCallback(async (doc: Document): Promise<string> => {
    const supabase = createClient()

    if (doc.is_public) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/equipment-documents/${doc.storage_path}`
    }

    const { data } = await supabase.storage
      .from('equipment-documents')
      .createSignedUrl(doc.storage_path, 3600)

    return data?.signedUrl ?? ''
  }, [])

  const handlePreview = useCallback(async (doc: Document) => {
    const url = await getDownloadUrl(doc)
    setPreviewUrl(url)
    setPreviewDocument(doc)
  }, [getDownloadUrl])

  const handleClosePreview = useCallback(() => {
    setPreviewDocument(null)
    setPreviewUrl(null)
  }, [])

  const handleDownload = useCallback(async (doc: Document) => {
    const url = await getDownloadUrl(doc)
    window.open(url, '_blank')
  }, [getDownloadUrl])

  const handleUnlink = useCallback(async (doc: Document) => {
    if (confirm(`Unlink "${doc.title}"? The document will remain in the library.`)) {
      if (equipmentId) {
        await unlinkDocumentFromEquipment(doc.id, equipmentId)
      } else if (projectId) {
        await unlinkDocumentFromProject(doc.id, projectId)
      }
    }
  }, [equipmentId, projectId, unlinkDocumentFromEquipment, unlinkDocumentFromProject])

  const handleLink = useCallback(async (doc: Document) => {
    if (equipmentId) {
      await linkDocumentToEquipment(doc.id, equipmentId)
    } else if (projectId) {
      await linkDocumentToProject(doc.id, projectId)
    }
  }, [equipmentId, projectId, linkDocumentToEquipment, linkDocumentToProject])

  if (loading && documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Documents
        </Typography>
        {canManage && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<LinkIcon />}
            onClick={() => setLinkOpen(true)}
          >
            Link Document
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {allTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label="All"
            variant={selectedTag === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedTag(null)}
            size="small"
          />
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
              onClick={() => setSelectedTag(tag)}
              size="small"
            />
          ))}
        </Box>
      )}

      {filteredDocuments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {documents.length === 0
            ? 'No documents linked yet.'
            : 'No documents match the selected filter.'}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canEdit={canManage}
              onPreview={() => handlePreview(doc)}
              onEdit={() => setEditDocument(doc)}
              onDelete={() => handleUnlink(doc)}
              onDownload={() => handleDownload(doc)}
              deleteLabel="Unlink"
            />
          ))}
        </Box>
      )}

      <DocumentUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <DocumentLinkAutocomplete
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onLink={handleLink}
        excludeDocumentIds={documents.map(d => d.id)}
      />

      <DocumentEditDialog
        open={editDocument !== null}
        onClose={() => setEditDocument(null)}
        document={editDocument}
      />

      <DocumentPreview
        open={previewDocument !== null}
        onClose={handleClosePreview}
        document={previewDocument}
        downloadUrl={previewUrl}
      />
    </Box>
  )
}
```

**Step 2: Update DocumentCard to support custom delete label**

Add `deleteLabel?: string` prop to DocumentCard and use it in the menu item.

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/features/documents/ && git commit -m "feat: update DocumentList for linking mode"
```

---

## Task 9: Create DocumentLibrary Component

**Files:**
- Create: `components/features/documents/DocumentLibrary.tsx`

**Step 1: Create the library component**

```typescript
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { useDocumentStore, useAuthStore } from '@/stores'
import { DocumentCard } from './DocumentCard'
import { DocumentUpload } from './DocumentUpload'
import { DocumentEditDialog } from './DocumentEditDialog'
import { DocumentPreview } from './DocumentPreview'
import { createClient } from '@/lib/supabase/client'
import type { Document, DocumentWithLinkCounts } from '@/types/database'

export function DocumentLibrary() {
  const { documents, loading, error, fetchAllDocuments, deleteDocument } = useDocumentStore()
  const { user } = useAuthStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')

  useEffect(() => {
    fetchAllDocuments()
  }, [fetchAllDocuments])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [documents])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          doc.title.toLowerCase().includes(query) ||
          (doc.description?.toLowerCase().includes(query) ?? false)
        if (!matchesSearch) return false
      }

      // Tag filter
      if (selectedTag && !doc.tags.includes(selectedTag)) {
        return false
      }

      // Visibility filter
      if (visibilityFilter === 'public' && !doc.is_public) return false
      if (visibilityFilter === 'private' && doc.is_public) return false

      return true
    })
  }, [documents, searchQuery, selectedTag, visibilityFilter])

  const getDownloadUrl = useCallback(async (doc: Document): Promise<string> => {
    const supabase = createClient()

    if (doc.is_public) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/equipment-documents/${doc.storage_path}`
    }

    const { data } = await supabase.storage
      .from('equipment-documents')
      .createSignedUrl(doc.storage_path, 3600)

    return data?.signedUrl ?? ''
  }, [])

  const handlePreview = useCallback(async (doc: Document) => {
    const url = await getDownloadUrl(doc)
    setPreviewUrl(url)
    setPreviewDocument(doc)
  }, [getDownloadUrl])

  const handleClosePreview = useCallback(() => {
    setPreviewDocument(null)
    setPreviewUrl(null)
  }, [])

  const handleDownload = useCallback(async (doc: Document) => {
    const url = await getDownloadUrl(doc)
    window.open(url, '_blank')
  }, [getDownloadUrl])

  const handleDelete = useCallback(async (doc: Document) => {
    if (confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
      await deleteDocument(doc.id)
    }
  }, [deleteDocument])

  const canEditDocument = (doc: DocumentWithLinkCounts) => {
    return doc.uploaded_by === user?.id || useAuthStore.getState().isAdmin()
  }

  if (loading && documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Documents
        </Typography>
        {user && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Upload Document
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Visibility</InputLabel>
          <Select
            value={visibilityFilter}
            label="Visibility"
            onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Members Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip
            label="All Tags"
            variant={selectedTag === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedTag(null)}
            size="small"
          />
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
              onClick={() => setSelectedTag(tag)}
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
      </Typography>

      {/* Document grid */}
      {filteredDocuments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {documents.length === 0
            ? 'No documents uploaded yet. Be the first to upload!'
            : 'No documents match your filters.'}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canEdit={canEditDocument(doc)}
              onPreview={() => handlePreview(doc)}
              onEdit={() => setEditDocument(doc)}
              onDelete={() => handleDelete(doc)}
              onDownload={() => handleDownload(doc)}
              showLinkCounts
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <DocumentUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <DocumentEditDialog
        open={editDocument !== null}
        onClose={() => setEditDocument(null)}
        document={editDocument}
      />

      <DocumentPreview
        open={previewDocument !== null}
        onClose={handleClosePreview}
        document={previewDocument}
        downloadUrl={previewUrl}
      />
    </Box>
  )
}
```

**Step 2: Export from index**

Add to `components/features/documents/index.ts`:

```typescript
export { DocumentLibrary } from './DocumentLibrary'
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/features/documents/ && git commit -m "feat: add DocumentLibrary component"
```

---

## Task 10: Update DocumentCard for Link Counts

**Files:**
- Modify: `components/features/documents/DocumentCard.tsx`

**Step 1: Add showLinkCounts and deleteLabel props**

Update to show equipment/project link counts when in library view:

```typescript
interface DocumentCardProps {
  document: Document | DocumentWithLinkCounts
  canEdit: boolean
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
  deleteLabel?: string
  showLinkCounts?: boolean
}
```

Add in the card content:

```typescript
{showLinkCounts && 'equipment_count' in document && (
  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
    {document.equipment_count > 0 && (
      <Chip
        size="small"
        label={`${document.equipment_count} equipment`}
        variant="outlined"
      />
    )}
    {document.project_count > 0 && (
      <Chip
        size="small"
        label={`${document.project_count} project${document.project_count > 1 ? 's' : ''}`}
        variant="outlined"
      />
    )}
  </Box>
)}
```

Update delete menu item to use `deleteLabel ?? 'Delete'`.

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/features/documents/DocumentCard.tsx && git commit -m "feat: add link counts to DocumentCard"
```

---

## Task 11: Create Documents Page

**Files:**
- Create: `app/(dashboard)/documents/page.tsx`

**Step 1: Create the page**

```typescript
import { DocumentLibrary } from '@/components/features/documents'

export default function DocumentsPage() {
  return <DocumentLibrary />
}
```

**Step 2: Run dev server to test**

```bash
npm run dev
```

Visit `/documents` to verify the page loads.

**Step 3: Commit**

```bash
git add app/\(dashboard\)/documents/page.tsx && git commit -m "feat: add documents page"
```

---

## Task 12: Add Documents to Navigation

**Files:**
- Modify: `components/ui/Navigation.tsx`

**Step 1: Add Documents nav item**

Add to `navItems` array after Projects:

```typescript
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'

const navItems = [
  { label: 'My Profile', href: '/profile', icon: <PersonIcon /> },
  { label: 'Equipment', href: '/equipment', icon: <BuildIcon /> },
  { label: 'Bookings', href: '/bookings', icon: <EventIcon /> },
  { label: 'Inductions', href: '/inductions', icon: <SchoolIcon /> },
  { label: 'Projects', href: '/projects', icon: <FolderIcon /> },
  { label: 'Documents', href: '/documents', icon: <InsertDriveFileIcon /> },
  { label: 'Design Doc', href: '/design', icon: <DescriptionIcon /> },
]
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/ui/Navigation.tsx && git commit -m "feat: add Documents to navigation"
```

---

## Task 13: Update Equipment Detail Page

**Files:**
- Modify: `app/(dashboard)/equipment/[category]/[id]/page.tsx`

**Step 1: Update useEffect to fetch linked documents**

Change `fetchDocumentsForEquipment` to use the new store method and pass `equipmentId` to `DocumentList`:

```typescript
const { fetchDocumentsForEquipment, clearLinkedDocuments } = useDocumentStore()

useEffect(() => {
  if (equipmentId) {
    fetchEquipmentById(equipmentId)
    fetchMyInductions()
    fetchMyRequests()
    fetchMyBookings()
    fetchDocumentsForEquipment(equipmentId)
  }

  return () => {
    clearSelected()
    clearLinkedDocuments()
  }
}, [equipmentId, fetchEquipmentById, fetchMyInductions, fetchMyRequests, fetchMyBookings, fetchDocumentsForEquipment, clearSelected, clearLinkedDocuments])
```

Update the DocumentList component:

```typescript
<DocumentList
  equipmentId={equipmentId}
  canManage={canManageDocuments}
/>
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/equipment/\[category\]/\[id\]/page.tsx && git commit -m "feat: update equipment page for document linking"
```

---

## Task 14: Add Documents Section to Project Detail Page

**Files:**
- Modify: `app/(dashboard)/projects/[id]/page.tsx`

**Step 1: Add document store and fetch**

Add imports and store usage:

```typescript
import { useDocumentStore } from '@/stores'
import { DocumentList } from '@/components/features/documents'

// In component:
const { fetchDocumentsForProject, clearLinkedDocuments } = useDocumentStore()

// In fetchProject callback, add:
fetchDocumentsForProject(projectId)

// In cleanup or when leaving, call clearLinkedDocuments()
```

**Step 2: Add Documents section after Project Details card**

```typescript
{/* Documents Section */}
<Card sx={{ mb: 4 }}>
  <CardContent>
    <DocumentList
      projectId={projectId}
      canManage={isOwner}
    />
  </CardContent>
</Card>
```

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add app/\(dashboard\)/projects/\[id\]/page.tsx && git commit -m "feat: add documents section to project page"
```

---

## Task 15: Final Testing and Cleanup

**Step 1: Run full type check**

```bash
npx tsc --noEmit
```

**Step 2: Test the complete flow**

1. Visit `/documents` - should see library
2. Upload a document
3. Go to equipment detail page, link the document
4. Go to project detail page, link the same document
5. Verify document shows link counts in library
6. Unlink from equipment
7. Delete document from library

**Step 3: Run linter**

```bash
npm run lint
```

**Step 4: Final commit**

```bash
git add -A && git commit -m "feat: complete document library implementation"
```
