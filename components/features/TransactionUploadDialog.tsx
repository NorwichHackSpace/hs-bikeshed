'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { useTransactionStore } from '@/stores'
import { getClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import type { ParsedTransaction } from '@/lib/csvParser'

interface TransactionUploadDialogProps {
  open: boolean
  onClose: () => void
  profiles: Profile[]
}

const steps = ['Upload CSV', 'Review Matches', 'Confirm Import']

export function TransactionUploadDialog({
  open,
  onClose,
  profiles,
}: TransactionUploadDialogProps) {
  const { uploadCSV, confirmImport } = useTransactionStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [parsedData, setParsedData] = useState<{
    transactions: ParsedTransaction[]
    matched: number
    unmatched: number
    duplicateCount: number
    importId: string
  } | null>(null)


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please drop a CSV file')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      const result = await uploadCSV(file, profiles)

      if (!result || !result.transactions) {
        throw new Error('Upload returned invalid result')
      }

      setParsedData(result)
      setActiveStep(1)
    } catch (err) {
      setError((err as Error).message || 'Unknown error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    if (!parsedData) return

    setError(null)
    setConfirming(true)
    try {
      await confirmImport(parsedData.importId, parsedData.transactions)
      setActiveStep(2)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setConfirming(false)
    }
  }

  // Handle manual matching of a transaction to a user
  const handleManualMatch = async (txIndex: number, selectedProfile: Profile | null) => {
    if (!parsedData) return

    const transaction = parsedData.transactions[txIndex]

    // Update the transaction in our local state
    const updatedTransactions = [...parsedData.transactions]

    if (selectedProfile) {
      updatedTransactions[txIndex] = {
        ...transaction,
        user_id: selectedProfile.id,
        match_confidence: 'auto', // Will be marked as 'manual' on confirm
        matched_user_name: selectedProfile.name || 'Unknown',
      }

      // If the user has no payment_reference, set it from the transaction description
      if (!selectedProfile.payment_reference) {
        try {
          const supabase = getClient()
          await supabase
            .from('profiles')
            .update({ payment_reference: transaction.description })
            .eq('id', selectedProfile.id)

          // Update the profile in our local profiles list so it shows correctly
          // (The parent component will refetch on close anyway)
        } catch (err) {
          console.error('Failed to update payment_reference:', err)
          // Don't block the match if this fails
        }
      }
    } else {
      // Unmatch the transaction
      updatedTransactions[txIndex] = {
        ...transaction,
        user_id: null,
        match_confidence: 'unmatched',
        matched_user_name: undefined,
      }
    }

    // Recalculate matched/unmatched counts (excluding duplicates)
    const nonDuplicates = updatedTransactions.filter((t) => !t.is_duplicate)
    const matched = nonDuplicates.filter((t) => t.user_id !== null).length
    const unmatched = nonDuplicates.filter((t) => t.user_id === null).length

    setParsedData({
      ...parsedData,
      transactions: updatedTransactions,
      matched,
      unmatched,
    })
  }

  const handleClose = () => {
    setActiveStep(0)
    setFile(null)
    setParsedData(null)
    setError(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Bank Transactions</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            {/* Hidden file input - outside clickable area */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : file ? 'success.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: dragOver ? 'action.hover' : file ? 'success.50' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onClick={handleBrowseClick}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: file ? 'success.main' : 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Drop CSV file here or click to browse'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB - Click "Upload & Parse" to continue`
                  : 'Supported formats: CSV with Date, Description, and Amount columns'
                }
              </Typography>
            </Box>
          </Box>
        )}

        {activeStep === 1 && parsedData && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${parsedData.matched} matched (will import)`}
                color="success"
              />
              <Chip
                icon={<WarningIcon />}
                label={`${parsedData.unmatched} unmatched (will skip)`}
                color="warning"
              />
              {parsedData.duplicateCount > 0 && (
                <Chip
                  label={`${parsedData.duplicateCount} duplicates (will skip)`}
                  color="default"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Review the transactions below. Only matched transactions will be imported.
              Use the dropdown to manually match transactions to users. If a user has no payment reference, it will be set automatically.
            </Typography>

            {parsedData.transactions.length === 0 ? (
              <Alert severity="info">
                No transactions found in the CSV file. Please check the file format and try again.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Matched User</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.transactions.map((tx, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor: tx.is_duplicate
                            ? 'action.disabledBackground'
                            : tx.match_confidence === 'auto'
                              ? 'success.50'
                              : tx.match_confidence === 'unmatched'
                                ? 'warning.50'
                                : undefined,
                          opacity: tx.is_duplicate ? 0.5 : 1,
                          textDecoration: tx.is_duplicate ? 'line-through' : 'none',
                        }}
                      >
                        <TableCell>{formatDate(tx.transaction_date)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 250,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={tx.amount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatAmount(tx.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          {tx.is_duplicate ? (
                            <Chip label="Duplicate" size="small" color="default" />
                          ) : tx.matched_user_name ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip
                                label={tx.matched_user_name}
                                size="small"
                                color="success"
                              />
                              <Tooltip title="Remove match">
                                <IconButton
                                  size="small"
                                  onClick={() => handleManualMatch(idx, null)}
                                  sx={{ p: 0.25 }}
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Autocomplete
                              size="small"
                              options={profiles}
                              getOptionLabel={(option) => option.name || option.email || 'Unknown'}
                              renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id}>
                                  <Box>
                                    <Typography variant="body2">{option.name}</Typography>
                                    {option.payment_reference && (
                                      <Typography variant="caption" color="text.secondary">
                                        Ref: {option.payment_reference}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              )}
                              onChange={(_, value) => handleManualMatch(idx, value)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Select user..."
                                  variant="outlined"
                                  sx={{ minWidth: 150 }}
                                />
                              )}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  py: 0,
                                },
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Import Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {parsedData?.matched ?? 0} matched transactions have been imported.
              {parsedData && parsedData.unmatched > 0 && (
                <> {parsedData.unmatched} unmatched transactions were skipped.</>
              )}
              {parsedData && parsedData.duplicateCount > 0 && (
                <> {parsedData.duplicateCount} duplicates were skipped.</>
              )}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {activeStep < 2 && <Button onClick={handleClose}>Cancel</Button>}

        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : undefined}
          >
            {uploading ? 'Processing...' : 'Upload & Parse'}
          </Button>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={confirming}>Back</Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={confirming}
              startIcon={confirming ? <CircularProgress size={20} /> : undefined}
            >
              {confirming ? 'Importing...' : 'Confirm Import'}
            </Button>
          </>
        )}

        {activeStep === 2 && (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
