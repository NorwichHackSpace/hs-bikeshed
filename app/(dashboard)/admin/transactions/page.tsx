'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import UploadIcon from '@mui/icons-material/Upload'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import { useTransactionStore } from '@/stores'
import { TransactionTable } from '@/components/features/TransactionTable'
import { TransactionUploadDialog } from '@/components/features/TransactionUploadDialog'
import { TransactionMatchDialog } from '@/components/features/TransactionMatchDialog'
import type { Profile, TransactionWithUser } from '@/types/database'
import SearchIcon from '@mui/icons-material/Search'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
      {value === index && children}
    </Box>
  )
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const {
    transactions,
    imports,
    loading,
    error,
    fetchTransactions,
    fetchImports,
    matchTransaction,
    unmatchTransaction,
    deleteImport,
    clearError,
  } = useTransactionStore()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [matchDialogOpen, setMatchDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all')

  const fetchProfiles = useCallback(async () => {
    const supabase = getClient()
    const { data } = await supabase.from('profiles').select('*').order('name')
    setProfiles(data ?? [])
  }, [])

  useEffect(() => {
    fetchTransactions()
    fetchImports()
    fetchProfiles()
  }, [fetchTransactions, fetchImports, fetchProfiles])

  const handleMatchClick = (transaction: TransactionWithUser) => {
    setSelectedTransaction(transaction)
    setMatchDialogOpen(true)
  }

  const handleUnmatchClick = async (transaction: TransactionWithUser) => {
    if (confirm('Remove the match for this transaction?')) {
      await unmatchTransaction(transaction.id)
    }
  }

  const handleMatch = async (transactionId: string, userId: string) => {
    await matchTransaction(transactionId, userId)
  }

  const handleDeleteImport = async (importId: string) => {
    if (confirm('Delete this import and all associated transactions? This cannot be undone.')) {
      await deleteImport(importId)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'matched' && tx.user_id !== null) ||
      (filterStatus === 'unmatched' && tx.user_id === null)

    return matchesSearch && matchesStatus
  })

  const unmatchedCount = transactions.filter((t) => t.match_confidence === 'unmatched').length
  const matchedCount = transactions.filter((t) => t.user_id !== null).length

  // Only show full-page loading on initial fetch, not during upload operations
  // Check if dialog is open to prevent unmounting it during upload
  if (loading && transactions.length === 0 && !uploadDialogOpen) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/admin')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            Bank Transactions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Import bank statements and match payments to members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip label={`${transactions.length} total`} variant="outlined" />
        <Chip label={`${matchedCount} matched`} color="success" />
        <Chip label={`${unmatchedCount} unmatched`} color="warning" />
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, pt: 1 }}>
            <Tab label="All Transactions" />
            <Tab label="Import History" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  placeholder="Search transactions..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: 300 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="matched">Matched</MenuItem>
                    <MenuItem value="unmatched">Unmatched</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TransactionTable
                transactions={filteredTransactions}
                onMatchClick={handleMatchClick}
                onUnmatchClick={handleUnmatchClick}
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 2, pb: 2 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Filename</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell align="center">Rows</TableCell>
                      <TableCell align="center">Matched</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {imports.map((imp) => (
                      <TableRow key={imp.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {imp.filename}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(imp.uploaded_at)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{imp.row_count ?? '-'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{imp.matched_count ?? '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={imp.status}
                            size="small"
                            color={
                              imp.status === 'completed'
                                ? 'success'
                                : imp.status === 'processing'
                                ? 'info'
                                : 'default'
                            }
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteImport(imp.id)}
                            title="Delete import"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {imports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No imports yet. Upload a CSV file to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      <TransactionUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        profiles={profiles}
      />

      <TransactionMatchDialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        transaction={selectedTransaction}
        profiles={profiles}
        onMatch={handleMatch}
        loading={loading}
      />
    </Box>
  )
}
