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
