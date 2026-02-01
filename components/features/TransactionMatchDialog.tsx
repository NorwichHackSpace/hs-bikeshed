'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import type { TransactionWithUser, Profile } from '@/types/database'

interface TransactionMatchDialogProps {
  open: boolean
  onClose: () => void
  transaction: TransactionWithUser | null
  profiles: Profile[]
  onMatch: (transactionId: string, userId: string) => Promise<void>
  loading?: boolean
}

export function TransactionMatchDialog({
  open,
  onClose,
  transaction,
  profiles,
  onMatch,
  loading = false,
}: TransactionMatchDialogProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMatch = async () => {
    if (!transaction || !selectedUser) return

    setError(null)
    try {
      await onMatch(transaction.id, selectedUser.id)
      setSelectedUser(null)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setError(null)
    onClose()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(Math.abs(amount))
    return amount >= 0 ? formatted : `-${formatted}`
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Match Transaction to User</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Transaction Details
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="body2">{formatDate(transaction.transaction_date)}</Typography>
            </Box>
            <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
              {transaction.description}
            </Typography>
            {transaction.reference && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reference: {transaction.reference}
              </Typography>
            )}
            <Typography
              variant="h6"
              color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
            >
              {formatAmount(transaction.amount)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select User to Match
          </Typography>
          <Autocomplete
            options={profiles}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name..."
                fullWidth
              />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return (
                <li key={key} {...rest}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                    {option.membership_status && (
                      <Chip
                        label={option.membership_status}
                        size="small"
                        color={option.membership_status === 'active' ? 'success' : 'default'}
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                </li>
              )
            }}
          />

          {selectedUser && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                backgroundColor: 'primary.50',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Selected user:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleMatch}
          disabled={!selectedUser || loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Matching...' : 'Match Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
