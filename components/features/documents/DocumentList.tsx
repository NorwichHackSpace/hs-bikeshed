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
import { useDocumentStore } from '@/stores'
import { DocumentCard } from './DocumentCard'
import { DocumentUpload } from './DocumentUpload'
import { DocumentEditDialog } from './DocumentEditDialog'
import { DocumentPreview } from './DocumentPreview'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

interface DocumentListProps {
  equipmentId: string
  canManage: boolean
}

export function DocumentList({ equipmentId, canManage }: DocumentListProps) {
  const { documents, loading, error, deleteDocument } = useDocumentStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editDocument, setEditDocument] = useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    documents.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [documents])

  // Filter documents by selected tag
  const filteredDocuments = useMemo(() => {
    if (!selectedTag) return documents
    return documents.filter((doc) => doc.tags.includes(selectedTag))
  }, [documents, selectedTag])

  const getDownloadUrl = useCallback(async (doc: Document): Promise<string> => {
    const supabase = createClient()

    if (doc.is_public) {
      // Public files can use direct URL
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/equipment-documents/${doc.storage_path}`
    }

    // Private files need signed URL
    const { data } = await supabase.storage
      .from('equipment-documents')
      .createSignedUrl(doc.storage_path, 3600) // 1 hour expiry

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

  if (loading && documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Documents
        </Typography>
        {canManage && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Add Document
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tag filter */}
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

      {/* Document grid */}
      {filteredDocuments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {documents.length === 0
            ? 'No documents uploaded yet.'
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
              onDelete={() => handleDelete(doc)}
              onDownload={() => handleDownload(doc)}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <DocumentUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        equipmentId={equipmentId}
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
