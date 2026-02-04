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
          renderOption={(props, option) => {
            const { key, ...otherProps } = props
            return (
              <Box component="li" key={key} {...otherProps}>
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
            )
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search documents"
              placeholder="Type to search..."
              helperText="Search by title or description"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
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
