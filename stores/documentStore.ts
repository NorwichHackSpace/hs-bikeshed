import { create } from 'zustand'
import { getClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

interface DocumentMetadata {
  title: string
  description?: string
  tags: string[]
  is_public: boolean
}

interface DocumentState {
  documents: Document[]
  loading: boolean
  uploading: boolean
  error: string | null
}

interface DocumentActions {
  fetchDocumentsForEquipment: (equipmentId: string) => Promise<void>
  uploadDocument: (equipmentId: string, file: File, metadata: DocumentMetadata) => Promise<void>
  updateDocument: (id: string, updates: Partial<DocumentMetadata>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  clearDocuments: () => void
}

type DocumentStore = DocumentState & DocumentActions

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  error: null,

  fetchDocumentsForEquipment: async (equipmentId) => {
    const supabase = getClient()
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ documents: data ?? [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  uploadDocument: async (equipmentId, file, metadata) => {
    const supabase = getClient()
    set({ uploading: true, error: null })

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique document ID and storage path
      const documentId = crypto.randomUUID()
      const storagePath = `${equipmentId}/${documentId}/${file.name}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('equipment-documents')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          equipment_id: equipmentId,
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

      if (insertError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('equipment-documents').remove([storagePath])
        throw insertError
      }

      // Refresh documents list
      await get().fetchDocumentsForEquipment(equipmentId)
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

      // Update local state
      set({
        documents: get().documents.map(doc =>
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
      // Get document to find storage path
      const doc = get().documents.find(d => d.id === id)
      if (!doc) throw new Error('Document not found')

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('equipment-documents')
        .remove([doc.storage_path])

      if (storageError) console.warn('Storage delete failed:', storageError)

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      // Update local state
      set({ documents: get().documents.filter(d => d.id !== id) })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  clearDocuments: () => {
    set({ documents: [], error: null })
  },
}))
