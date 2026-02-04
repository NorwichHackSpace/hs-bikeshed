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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
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
