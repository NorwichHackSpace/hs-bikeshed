'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Divider,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Chip,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import HomeIcon from '@mui/icons-material/Home'
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuthStore } from '@/stores'
import type { Profile } from '@/types/database'

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone number is required'),
  addressLine1: Yup.string().required('Address is required'),
  addressLine2: Yup.string(),
  city: Yup.string().required('City is required'),
  county: Yup.string().required('County is required'),
  postcode: Yup.string().required('Postcode is required'),
  country: Yup.string().required('Country is required'),
  interestsSkills: Yup.string(),
  hackspaceGoals: Yup.string(),
  shareDetailsWithMembers: Yup.string().oneOf(['yes', 'no', 'discuss']),
  emergencyContactName: Yup.string().required('Emergency contact name is required'),
  emergencyContactRelationship: Yup.string().required('Relationship is required'),
  emergencyContactMobile: Yup.string().required('Mobile number is required'),
  emergencyContactLandline: Yup.string(),
  hasMedicalConditions: Yup.boolean(),
  medicalConditionsDetails: Yup.string(),
  optInCommunications: Yup.boolean(),
  optInMarketing: Yup.boolean(),
})

interface ProfileFormValues {
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
  interestsSkills: string
  hackspaceGoals: string
  shareDetailsWithMembers: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactMobile: string
  emergencyContactLandline: string
  hasMedicalConditions: boolean
  medicalConditionsDetails: string
  optInCommunications: boolean
  optInMarketing: boolean
}

const mapProfileToFormValues = (profile: Profile | null): ProfileFormValues => ({
  firstName: profile?.first_name ?? '',
  lastName: profile?.last_name ?? '',
  phone: profile?.phone ?? '',
  addressLine1: profile?.address_line1 ?? '',
  addressLine2: profile?.address_line2 ?? '',
  city: profile?.city ?? '',
  county: profile?.county ?? '',
  postcode: profile?.postcode ?? '',
  country: profile?.country ?? 'United Kingdom',
  interestsSkills: profile?.interests_skills ?? '',
  hackspaceGoals: profile?.hackspace_goals ?? '',
  shareDetailsWithMembers: profile?.share_details_with_members ?? 'no',
  emergencyContactName: profile?.emergency_contact_name ?? '',
  emergencyContactRelationship: profile?.emergency_contact_relationship ?? '',
  emergencyContactMobile: profile?.emergency_contact_mobile ?? '',
  emergencyContactLandline: profile?.emergency_contact_landline ?? '',
  hasMedicalConditions: profile?.has_medical_conditions ?? false,
  medicalConditionsDetails: profile?.medical_conditions_details ?? '',
  optInCommunications: profile?.opt_in_communications ?? false,
  optInMarketing: profile?.opt_in_marketing ?? false,
})

// Section header component
function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      {icon}
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  )
}

// Agreement status component
function AgreementStatus({ agreed, label }: { agreed: boolean | null | undefined; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      {agreed ? (
        <CheckCircleIcon color="success" fontSize="small" />
      ) : (
        <CancelOutlinedIcon color="error" fontSize="small" />
      )}
      <Typography variant="body2">{label}</Typography>
    </Box>
  )
}

const roleLabels: Record<string, string> = {
  member: 'Member',
  equipment_maintainer: 'Equipment Maintainer',
  administrator: 'Administrator',
}

const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  member: 'default',
  equipment_maintainer: 'info',
  administrator: 'error',
}

export default function ProfilePage() {
  const { profile, roles, loading, error, updateProfile, fetchProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const formik = useFormik<ProfileFormValues>({
    initialValues: mapProfileToFormValues(profile),
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await updateProfile({
          first_name: values.firstName,
          last_name: values.lastName,
          name: `${values.firstName} ${values.lastName}`.trim(),
          phone: values.phone,
          address_line1: values.addressLine1,
          address_line2: values.addressLine2 || null,
          city: values.city,
          county: values.county,
          postcode: values.postcode,
          country: values.country,
          interests_skills: values.interestsSkills || null,
          hackspace_goals: values.hackspaceGoals || null,
          share_details_with_members: values.shareDetailsWithMembers,
          emergency_contact_name: values.emergencyContactName,
          emergency_contact_relationship: values.emergencyContactRelationship,
          emergency_contact_mobile: values.emergencyContactMobile,
          emergency_contact_landline: values.emergencyContactLandline || null,
          has_medical_conditions: values.hasMedicalConditions,
          medical_conditions_details: values.medicalConditionsDetails || null,
          opt_in_communications: values.optInCommunications,
          opt_in_marketing: values.optInMarketing,
        })
        setIsEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } catch {
        // Error handled by store
      }
    },
  })

  useEffect(() => {
    if (!profile) {
      fetchProfile()
    }
  }, [profile, fetchProfile])

  const handleCancel = () => {
    formik.resetForm({ values: mapProfileToFormValues(profile) })
    setIsEditing(false)
  }

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const membershipStatusColor = {
    active: 'success',
    inactive: 'warning',
    lapsed: 'error',
  } as const

  const formatAddress = () => {
    const parts = [
      profile?.address_line1,
      profile?.address_line2,
      profile?.city,
      profile?.county,
      profile?.postcode,
      profile?.country,
    ].filter(Boolean)
    return parts.join(', ')
  }

  const shareDetailsLabel = {
    yes: 'Yes, share with other members',
    no: 'No, keep private',
    discuss: 'Ask me first',
  }

  // VIEW MODE
  if (!isEditing) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your membership details
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}

        {/* Profile Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)', color: '#000',
                fontSize: '2.5rem',
                fontWeight: 600,
              }}
            >
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={600}>
                {profile?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {profile?.email}
                  </Typography>
                </Box>
                {profile?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {profile.phone}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {profile?.membership_status && (
                  <Chip
                    label={profile.membership_status}
                    color={membershipStatusColor[profile.membership_status]}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                )}
                {roles.map((role) => (
                  <Chip
                    key={role}
                    label={roleLabels[role] ?? role}
                    color={roleColors[role] ?? 'default'}
                    size="small"
                    variant="filled"
                  />
                ))}
                {profile?.join_date && (
                  <Chip
                    label={`Member since ${new Date(profile.join_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Address Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="Address" icon={<HomeIcon color="primary" />} />
              {formatAddress() ? (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {profile?.address_line1}
                  {profile?.address_line2 && <><br />{profile.address_line2}</>}
                  <br />
                  {profile?.city}{profile?.county && `, ${profile.county}`}
                  <br />
                  {profile?.postcode}
                  <br />
                  {profile?.country}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No address provided
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Emergency Contact Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="Emergency Contact" icon={<ContactEmergencyIcon color="error" />} />
              {profile?.emergency_contact_name ? (
                <>
                  <Typography variant="h6" fontWeight={500}>
                    {profile.emergency_contact_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {profile.emergency_contact_relationship}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{profile.emergency_contact_mobile}</Typography>
                    </Box>
                    {profile.emergency_contact_landline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{profile.emergency_contact_landline} (landline)</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No emergency contact provided
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* About Me Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="About Me" icon={<EditIcon color="primary" />} />

              {profile?.interests_skills && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Interests, Skills & Qualifications
                  </Typography>
                  <Typography variant="body2">{profile.interests_skills}</Typography>
                </Box>
              )}

              {profile?.hackspace_goals && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    What I want from the Hackspace
                  </Typography>
                  <Typography variant="body2">{profile.hackspace_goals}</Typography>
                </Box>
              )}

              {profile?.referral_source && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    How I heard about Norwich Hackspace
                  </Typography>
                  <Typography variant="body2">{profile.referral_source}</Typography>
                </Box>
              )}

              {!profile?.interests_skills && !profile?.hackspace_goals && !profile?.referral_source && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No information provided
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Medical Information Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="Medical Information" icon={<LocalHospitalIcon color="warning" />} />
              {profile?.has_medical_conditions ? (
                <>
                  <Chip label="Medical conditions noted" color="warning" size="small" sx={{ mb: 2 }} />
                  {profile.medical_conditions_details && (
                    <Typography variant="body2">{profile.medical_conditions_details}</Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No medical conditions recorded
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Preferences Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="Preferences" icon={<CheckCircleIcon color="primary" />} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Share contact details with members
                </Typography>
                <Typography variant="body2">
                  {shareDetailsLabel[profile?.share_details_with_members as keyof typeof shareDetailsLabel] ?? 'Not specified'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Communication
              </Typography>
              <AgreementStatus agreed={profile?.opt_in_communications} label="Receive news and updates" />
              <AgreementStatus agreed={profile?.opt_in_marketing} label="Included in promotional materials" />
            </Paper>
          </Grid>

          {/* Policy Agreements Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <SectionHeader title="Policy Agreements" icon={<CheckCircleIcon color="success" />} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Agreed at signup
              </Typography>
              <AgreementStatus agreed={profile?.accepted_policies} label="Rules of Engagement and Safety Policies" />
              <AgreementStatus agreed={profile?.accepted_safety_responsibility} label="Responsible for own safety" />
              <AgreementStatus agreed={profile?.is_over_18} label="Over 18 years of age" />
              <AgreementStatus agreed={profile?.standing_order_confirmed} label="Standing order set up" />
              <AgreementStatus agreed={profile?.had_tour} label="Had a guided tour" />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    )
  }

  // EDIT MODE
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Edit Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update your membership details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                      helperText={formik.touched.firstName && formik.errors.firstName}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                      helperText={formik.touched.lastName && formik.errors.lastName}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profile?.email ?? ''}
                      disabled
                      helperText="Email cannot be changed here"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phone && Boolean(formik.errors.phone)}
                      helperText={formik.touched.phone && formik.errors.phone}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Address Line 1"
                      name="addressLine1"
                      value={formik.values.addressLine1}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
                      helperText={formik.touched.addressLine1 && formik.errors.addressLine1}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Address Line 2"
                      name="addressLine2"
                      value={formik.values.addressLine2}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={formik.values.city}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.city && Boolean(formik.errors.city)}
                      helperText={formik.touched.city && formik.errors.city}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="County"
                      name="county"
                      value={formik.values.county}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.county && Boolean(formik.errors.county)}
                      helperText={formik.touched.county && formik.errors.county}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Postcode"
                      name="postcode"
                      value={formik.values.postcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.postcode && Boolean(formik.errors.postcode)}
                      helperText={formik.touched.postcode && formik.errors.postcode}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      value={formik.values.country}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.country && Boolean(formik.errors.country)}
                      helperText={formik.touched.country && formik.errors.country}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* About Me */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  About Me
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Interests, Skills or Qualifications"
                      name="interestsSkills"
                      value={formik.values.interestsSkills}
                      onChange={formik.handleChange}
                      helperText="Tell us about your background and what you can bring to the hackspace"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="What do you most want from Norwich Hackspace?"
                      name="hackspaceGoals"
                      value={formik.values.hackspaceGoals}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControl>
                      <FormLabel>Share contact details with other members?</FormLabel>
                      <RadioGroup
                        name="shareDetailsWithMembers"
                        value={formik.values.shareDetailsWithMembers}
                        onChange={formik.handleChange}
                        row
                      >
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                        <FormControlLabel value="discuss" control={<Radio />} label="Ask me first" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Emergency Contact */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      name="emergencyContactName"
                      value={formik.values.emergencyContactName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.emergencyContactName && Boolean(formik.errors.emergencyContactName)}
                      helperText={formik.touched.emergencyContactName && formik.errors.emergencyContactName}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      name="emergencyContactRelationship"
                      value={formik.values.emergencyContactRelationship}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.emergencyContactRelationship && Boolean(formik.errors.emergencyContactRelationship)}
                      helperText={formik.touched.emergencyContactRelationship && formik.errors.emergencyContactRelationship}
                      placeholder="e.g. Partner, Parent, Friend"
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      name="emergencyContactMobile"
                      value={formik.values.emergencyContactMobile}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.emergencyContactMobile && Boolean(formik.errors.emergencyContactMobile)}
                      helperText={formik.touched.emergencyContactMobile && formik.errors.emergencyContactMobile}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Landline (Optional)"
                      name="emergencyContactLandline"
                      value={formik.values.emergencyContactLandline}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Medical Information */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Medical Information
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="hasMedicalConditions"
                      checked={formik.values.hasMedicalConditions}
                      onChange={formik.handleChange}
                    />
                  }
                  label="I have medical conditions the hackspace should be aware of"
                />
                {formik.values.hasMedicalConditions && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Medical Conditions Details"
                    name="medicalConditionsDetails"
                    value={formik.values.medicalConditionsDetails}
                    onChange={formik.handleChange}
                    helperText="This information is kept confidential and only used in emergencies"
                    sx={{ mt: 2 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Communication Preferences */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Communication Preferences
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="optInCommunications"
                      checked={formik.values.optInCommunications}
                      onChange={formik.handleChange}
                    />
                  }
                  label="I would like to receive news and updates from Norwich Hackspace"
                />
                <br />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="optInMarketing"
                      checked={formik.values.optInMarketing}
                      onChange={formik.handleChange}
                    />
                  }
                  label="I am happy to be included in promotional materials and photos"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}
