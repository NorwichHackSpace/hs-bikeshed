'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import type { Document } from '@/types/database'

interface DocumentPreviewProps {
  open: boolean
  onClose: () => void
  document: Document | null
  downloadUrl: string | null
}

export function DocumentPreview({ open, onClose, document, downloadUrl }: DocumentPreviewProps) {
  if (!document || !downloadUrl) return null

  const isPdf = document.mime_type === 'application/pdf'
  const isImage = document.mime_type.startsWith('image/')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }} noWrap>
          {document.title}
        </Typography>
        <IconButton
          component="a"
          href={downloadUrl}
          download={document.filename}
          title="Download"
        >
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={onClose} title="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        {isPdf && (
          <Box
            component="iframe"
            src={`${downloadUrl}#view=FitH`}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={document.title}
          />
        )}

        {isImage && (
          <Box
            component="img"
            src={downloadUrl}
            alt={document.title}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {!isPdf && !isImage && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Preview not available for this file type
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              component="a"
              href={downloadUrl}
              download={document.filename}
            >
              Download File
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
