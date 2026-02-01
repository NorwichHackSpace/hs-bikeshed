'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Avatar,
  InputAdornment,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Divider,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useRouter } from 'next/navigation'
import { getClient } from '@/lib/supabase/client'
import type { Profile, UserRole, Equipment, PaymentSummary, Transaction } from '@/types/database'
import { useTransactionStore } from '@/stores'

interface UserWithRoles extends Profile {
  roles: UserRole[]
  maintainerOf: string[] // equipment IDs
}

const roleLabels: Record<UserRole, string> = {
  member: 'Member',
  equipment_maintainer: 'Equipment Maintainer',
  administrator: 'Administrator',
}

const roleColors: Record<UserRole, 'default' | 'info' | 'error'> = {
  member: 'default',
  equipment_maintainer: 'info',
  administrator: 'error',
}

const membershipStatusColors: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  lapsed: 'error',
}

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

function PaymentsTabContent({ userId }: { userId: string | undefined }) {
  const { getUserPaymentSummary } = useTransactionStore()
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      setLoading(true)
      getUserPaymentSummary(userId)
        .then(setPaymentSummary)
        .finally(() => setLoading(false))
    }
  }, [userId, getUserPaymentSummary])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  if (!userId) {
    return <Typography color="text.secondary">No user selected</Typography>
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (!paymentSummary) {
    return <Typography color="text.secondary">Unable to load payment data</Typography>
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600} color="success.main">
              {formatAmount(paymentSummary.totalPaid)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Paid
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {paymentSummary.paymentCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Payments
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {formatDate(paymentSummary.lastPaymentDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Payment
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {paymentSummary.transactions.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentSummary.transactions.map((tx: Transaction) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.transaction_date)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
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
                      fontWeight={500}
                      color={tx.amount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatAmount(Number(tx.amount))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No payment records found for this user
        </Typography>
      )}
    </Box>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipStatus: 'active' as 'active' | 'inactive' | 'lapsed',
    roles: [] as UserRole[],
    maintainerOf: [] as string[],
    paymentReference: '',
  })

  const fetchUsers = useCallback(async () => {
    const supabase = getClient()
    setLoading(true)
    setError(null)

    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

      if (profilesError) throw profilesError

      // Fetch all user roles
      const { data: roleRecords, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')

      if (rolesError) throw rolesError

      // Fetch all equipment maintainer assignments
      const { data: maintainerRecords, error: maintainerError } = await supabase
        .from('equipment_maintainers')
        .select('user_id, equipment_id')

      if (maintainerError) throw maintainerError

      // Fetch all equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .order('name')

      if (equipmentError) throw equipmentError

      setAllEquipment(equipment || [])

      // Map roles to users
      const rolesByUser = new Map<string, UserRole[]>()
      roleRecords?.forEach((record) => {
        const existing = rolesByUser.get(record.user_id) || []
        rolesByUser.set(record.user_id, [...existing, record.role])
      })

      // Map maintainer assignments to users
      const maintainerByUser = new Map<string, string[]>()
      maintainerRecords?.forEach((record) => {
        const existing = maintainerByUser.get(record.user_id) || []
        maintainerByUser.set(record.user_id, [...existing, record.equipment_id])
      })

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: rolesByUser.get(profile.id) || [],
        maintainerOf: maintainerByUser.get(profile.id) || [],
      }))

      setUsers(usersWithRoles)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleEditClick = (user: UserWithRoles) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      membershipStatus: user.membership_status || 'active',
      roles: user.roles,
      maintainerOf: user.maintainerOf,
      paymentReference: user.payment_reference || '',
    })
    setActiveTab(0)
    setDialogOpen(true)
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    setEditForm((prev) => ({
      ...prev,
      maintainerOf: prev.maintainerOf.includes(equipmentId)
        ? prev.maintainerOf.filter((id) => id !== equipmentId)
        : [...prev.maintainerOf, equipmentId],
    }))
  }

  const handleRoleToggle = (role: UserRole) => {
    setEditForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }))
  }

  const handleSave = async () => {
    if (!editingUser) return

    const supabase = getClient()
    setSaving(true)
    setError(null)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          name: `${editForm.firstName} ${editForm.lastName}`.trim(),
          phone: editForm.phone,
          membership_status: editForm.membershipStatus,
          payment_reference: editForm.paymentReference || null,
        })
        .eq('id', editingUser.id)

      if (profileError) throw profileError

      // Update roles - delete existing and insert new
      const { error: deleteRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id)

      if (deleteRolesError) throw deleteRolesError

      if (editForm.roles.length > 0) {
        const { error: insertRolesError } = await supabase.from('user_roles').insert(
          editForm.roles.map((role) => ({
            user_id: editingUser.id,
            role,
          }))
        )

        if (insertRolesError) throw insertRolesError
      }

      // Update equipment maintainer assignments - delete existing and insert new
      const { error: deleteMaintainerError } = await supabase
        .from('equipment_maintainers')
        .delete()
        .eq('user_id', editingUser.id)

      if (deleteMaintainerError) throw deleteMaintainerError

      if (editForm.maintainerOf.length > 0) {
        const { error: insertMaintainerError } = await supabase
          .from('equipment_maintainers')
          .insert(
            editForm.maintainerOf.map((equipmentId) => ({
              user_id: editingUser.id,
              equipment_id: equipmentId,
            }))
          )

        if (insertMaintainerError) throw insertMaintainerError
      }

      // Refresh users list
      await fetchUsers()
      setDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    )
  })

  if (loading) {
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
        <Box>
          <Typography variant="h4" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage member profiles and roles
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <TextField
              placeholder="Search users..."
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
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase() ?? '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.phone || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      {user.membership_status ? (
                        <Chip
                          label={user.membership_status}
                          color={membershipStatusColors[user.membership_status]}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Chip
                              key={role}
                              label={
                                role === 'equipment_maintainer' && user.maintainerOf.length > 0
                                  ? `${roleLabels[role]} (${user.maintainerOf.length})`
                                  : roleLabels[role]
                              }
                              color={roleColors[role]}
                              size="small"
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No roles
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.join_date
                          ? new Date(user.join_date).toLocaleDateString('en-GB')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(user)}
                        title="Edit user"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No users found matching your search' : 'No users found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
              }}
            >
              {editingUser?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Box>
              <Typography variant="h6">Edit User</Typography>
              <Typography variant="body2" color="text.secondary">
                {editingUser?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Profile" />
            <Tab label="Roles" />
            <Tab label="Payments" />
            <Tab label="Details" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editForm.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Membership Status"
                  value={editForm.membershipStatus}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      membershipStatus: e.target.value as 'active' | 'inactive' | 'lapsed',
                    }))
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="lapsed">Lapsed</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Payment Reference"
                  value={editForm.paymentReference}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="e.g., SHALOM T"
                  helperText="Bank transaction descriptions starting with this text will auto-match to this user (min 5 characters)"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Assign Roles</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm.roles.includes('member')}
                      onChange={() => handleRoleToggle('member')}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Member</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Basic hackspace member access
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm.roles.includes('equipment_maintainer')}
                      onChange={() => handleRoleToggle('equipment_maintainer')}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Equipment Maintainer</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Can manage equipment, approve inductions, and handle maintenance
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm.roles.includes('administrator')}
                      onChange={() => handleRoleToggle('administrator')}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Administrator</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Full system access including user management
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </FormControl>

            {/* Equipment Maintainer Assignments */}
            {editForm.roles.includes('equipment_maintainer') && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2 }}>
                    Equipment Maintainer Assignments
                  </FormLabel>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select which equipment this user is responsible for maintaining:
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <FormGroup sx={{ p: 2 }}>
                      {allEquipment.map((equipment) => (
                        <FormControlLabel
                          key={equipment.id}
                          control={
                            <Checkbox
                              checked={editForm.maintainerOf.includes(equipment.id)}
                              onChange={() => handleEquipmentToggle(equipment.id)}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{equipment.name}</Typography>
                              {equipment.category && (
                                <Chip label={equipment.category} size="small" variant="outlined" />
                              )}
                            </Box>
                          }
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                      {allEquipment.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No equipment found
                        </Typography>
                      )}
                    </FormGroup>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {editForm.maintainerOf.length} equipment item{editForm.maintainerOf.length !== 1 ? 's' : ''} assigned
                  </Typography>
                </FormControl>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <PaymentsTabContent userId={editingUser?.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">
                  {editingUser?.address_line1 ? (
                    <>
                      {editingUser.address_line1}
                      {editingUser.address_line2 && <><br />{editingUser.address_line2}</>}
                      <br />
                      {editingUser.city}, {editingUser.county}
                      <br />
                      {editingUser.postcode}
                      <br />
                      {editingUser.country}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Emergency Contact
                </Typography>
                <Typography variant="body2">
                  {editingUser?.emergency_contact_name ? (
                    <>
                      {editingUser.emergency_contact_name} ({editingUser.emergency_contact_relationship})
                      <br />
                      {editingUser.emergency_contact_mobile}
                      {editingUser.emergency_contact_landline && <><br />{editingUser.emergency_contact_landline}</>}
                    </>
                  ) : (
                    'Not provided'
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Interests & Skills
                </Typography>
                <Typography variant="body2">
                  {editingUser?.interests_skills || 'Not provided'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hackspace Goals
                </Typography>
                <Typography variant="body2">
                  {editingUser?.hackspace_goals || 'Not provided'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Medical Conditions
                </Typography>
                <Typography variant="body2">
                  {editingUser?.has_medical_conditions
                    ? editingUser.medical_conditions_details || 'Yes (no details)'
                    : 'None'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Referral Source
                </Typography>
                <Typography variant="body2">
                  {editingUser?.referral_source || 'Not provided'}
                </Typography>
              </Grid>
              {/* Equipment Maintainer Assignments */}
              {editingUser?.maintainerOf && editingUser.maintainerOf.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Equipment Maintainer For
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {editingUser.maintainerOf.map((equipmentId) => {
                      const equipment = allEquipment.find((e) => e.id === equipmentId)
                      return (
                        <Chip
                          key={equipmentId}
                          label={equipment?.name ?? 'Unknown'}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )
                    })}
                  </Box>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Agreements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Policies Accepted"
                    color={editingUser?.accepted_policies ? 'success' : 'error'}
                    size="small"
                    variant={editingUser?.accepted_policies ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Safety Responsibility"
                    color={editingUser?.accepted_safety_responsibility ? 'success' : 'error'}
                    size="small"
                    variant={editingUser?.accepted_safety_responsibility ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Over 18"
                    color={editingUser?.is_over_18 ? 'success' : 'error'}
                    size="small"
                    variant={editingUser?.is_over_18 ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Standing Order"
                    color={editingUser?.standing_order_confirmed ? 'success' : 'error'}
                    size="small"
                    variant={editingUser?.standing_order_confirmed ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="Had Tour"
                    color={editingUser?.had_tour ? 'success' : 'default'}
                    size="small"
                    variant={editingUser?.had_tour ? 'filled' : 'outlined'}
                  />
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
