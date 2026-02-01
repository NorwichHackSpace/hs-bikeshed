'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Tooltip,
} from '@mui/material'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import PersonIcon from '@mui/icons-material/Person'
import type { TransactionWithUser } from '@/types/database'

interface TransactionTableProps {
  transactions: TransactionWithUser[]
  onMatchClick?: (transaction: TransactionWithUser) => void
  onUnmatchClick?: (transaction: TransactionWithUser) => void
  showUser?: boolean
}

const confidenceColors: Record<string, 'success' | 'info' | 'warning'> = {
  auto: 'info',
  manual: 'success',
  unmatched: 'warning',
}

const confidenceLabels: Record<string, string> = {
  auto: 'Auto-matched',
  manual: 'Manual',
  unmatched: 'Unmatched',
}

export function TransactionTable({
  transactions,
  onMatchClick,
  onUnmatchClick,
  showUser = true,
}: TransactionTableProps) {
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

  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">No transactions found</Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Amount</TableCell>
            {showUser && <TableCell>Matched User</TableCell>}
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              hover
              sx={{
                backgroundColor: tx.match_confidence === 'unmatched' ? 'action.hover' : undefined,
              }}
            >
              <TableCell>
                <Typography variant="body2">{formatDate(tx.transaction_date)}</Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tx.description}
                </Typography>
                {tx.reference && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Ref: {tx.reference}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={tx.amount >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatAmount(tx.amount)}
                </Typography>
              </TableCell>
              {showUser && (
                <TableCell>
                  {tx.profiles ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">{tx.profiles.name}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              )}
              <TableCell>
                {tx.match_confidence && (
                  <Chip
                    label={confidenceLabels[tx.match_confidence]}
                    color={confidenceColors[tx.match_confidence]}
                    size="small"
                  />
                )}
              </TableCell>
              <TableCell align="right">
                {tx.match_confidence === 'unmatched' ? (
                  <Tooltip title="Match to user">
                    <IconButton
                      size="small"
                      onClick={() => onMatchClick?.(tx)}
                      color="primary"
                    >
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Remove match">
                    <IconButton
                      size="small"
                      onClick={() => onUnmatchClick?.(tx)}
                      color="default"
                    >
                      <LinkOffIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
