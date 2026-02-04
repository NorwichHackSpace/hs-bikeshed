'use client'

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PublicIcon from '@mui/icons-material/Public'
import LockIcon from '@mui/icons-material/Lock'
import { useState } from 'react'
import type { Document } from '@/types/database'

interface DocumentCardProps {
  document: Document
  canEdit: boolean
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon />
  if (mimeType.startsWith('image/')) return <ImageIcon />
  return <InsertDriveFileIcon />
}

export function DocumentCard({
  document,
  canEdit,
  onPreview,
  onEdit,
  onDelete,
  onDownload,
}: DocumentCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (action: () => void) => {
    handleMenuClose()
    action()
  }

  const canPreview =
    document.mime_type === 'application/pdf' ||
    document.mime_type.startsWith('image/')

  return (
    <Card
      sx={{
        cursor: canPreview ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': canPreview ? { boxShadow: 4 } : {},
      }}
      onClick={canPreview ? onPreview : undefined}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* File icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1,
              backgroundColor: alpha('#1A73E8', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {getFileIcon(document.mime_type)}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                noWrap
                sx={{ flex: 1 }}
              >
                {document.title}
              </Typography>
              {document.is_public ? (
                <PublicIcon fontSize="small" color="action" titleAccess="Public" />
              ) : (
                <LockIcon fontSize="small" color="action" titleAccess="Members only" />
              )}
              {canEdit && (
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  sx={{ ml: -0.5 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {document.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {document.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(document.file_size)}
              </Typography>
              {document.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {document.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                  {document.tags.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{document.tags.length - 3}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction(onDownload)}>Download</MenuItem>
        {canPreview && (
          <MenuItem onClick={() => handleAction(onPreview)}>Preview</MenuItem>
        )}
        <MenuItem onClick={() => handleAction(onEdit)}>Edit</MenuItem>
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  )
}
