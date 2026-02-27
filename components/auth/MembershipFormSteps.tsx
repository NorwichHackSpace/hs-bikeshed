'use client'

import {
  Box,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
  useTheme,
} from '@mui/material'
import type { FormikProps } from 'formik'
import * as Yup from 'yup'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileFormValues {
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
  hadTour: boolean
  hackspaceGoals: string
  shareDetailsWithMembers: 'yes' | 'no' | 'discuss'
  referralSource: string
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactMobile: string
  emergencyContactLandline: string
  hasMedicalConditions: boolean
  medicalConditionsDetails: string
  acceptedPolicies: boolean
  acceptedSafetyResponsibility: boolean
  isOver18: boolean
  standingOrderConfirmed: boolean
  optInCommunications: boolean
  optInMarketing: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PROFILE_STEPS = [
  'Personal Info',
  'Address',
  'About You',
  'Emergency Contact',
  'Agreements',
] as const

export const profileInitialValues: ProfileFormValues = {
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
  interestsSkills: '',
  hadTour: false,
  hackspaceGoals: '',
  shareDetailsWithMembers: 'no',
  referralSource: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactMobile: '',
  emergencyContactLandline: '',
  hasMedicalConditions: false,
  medicalConditionsDetails: '',
  acceptedPolicies: false,
  acceptedSafetyResponsibility: false,
  isOver18: false,
  standingOrderConfirmed: false,
  optInCommunications: false,
  optInMarketing: false,
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const profileValidationSchema = Yup.object({
  // Personal Info
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone number is required'),

  // Address
  addressLine1: Yup.string().required('Address is required'),
  addressLine2: Yup.string(),
  city: Yup.string().required('City is required'),
  county: Yup.string().required('County is required'),
  postcode: Yup.string().required('Postcode is required'),
  country: Yup.string().required('Country is required'),

  // About You
  interestsSkills: Yup.string().required('Please tell us about your interests and skills'),
  hadTour: Yup.boolean(),
  hackspaceGoals: Yup.string().required(
    'Please tell us what you hope to get from the hackspace',
  ),
  shareDetailsWithMembers: Yup.string()
    .oneOf(['yes', 'no', 'discuss'])
    .required('Please select an option'),
  referralSource: Yup.string().required('Please tell us how you heard about us'),

  // Emergency Contact
  emergencyContactName: Yup.string().required('Emergency contact name is required'),
  emergencyContactRelationship: Yup.string().required('Relationship is required'),
  emergencyContactMobile: Yup.string().required('Mobile number is required'),
  emergencyContactLandline: Yup.string(),
  hasMedicalConditions: Yup.boolean(),
  medicalConditionsDetails: Yup.string().when('hasMedicalConditions', {
    is: true,
    then: (schema) => schema.required('Please provide details of your medical conditions'),
  }),

  // Agreements
  acceptedPolicies: Yup.boolean()
    .oneOf([true], 'You must read and accept the policies')
    .required(),
  acceptedSafetyResponsibility: Yup.boolean()
    .oneOf([true], 'You must accept responsibility for your own safety')
    .required(),
  isOver18: Yup.boolean().oneOf([true], 'You must be over 18 to join').required(),
  standingOrderConfirmed: Yup.boolean()
    .oneOf([true], 'You must set up a standing order')
    .required(),
  optInCommunications: Yup.boolean(),
  optInMarketing: Yup.boolean(),
})

// ---------------------------------------------------------------------------
// Per-step field lists (for step-level validation)
// ---------------------------------------------------------------------------

export const profileStepFields: (keyof ProfileFormValues)[][] = [
  ['firstName', 'lastName', 'phone'],
  ['addressLine1', 'city', 'county', 'postcode', 'country'],
  ['interestsSkills', 'hackspaceGoals', 'shareDetailsWithMembers', 'referralSource'],
  ['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactMobile'],
  ['acceptedPolicies', 'acceptedSafetyResponsibility', 'isOver18', 'standingOrderConfirmed'],
]

// ---------------------------------------------------------------------------
// ProfileStep component
// ---------------------------------------------------------------------------

interface ProfileStepProps<T extends ProfileFormValues> {
  stepIndex: number
  formik: FormikProps<T>
  options?: { email?: string }
}

export function ProfileStep<T extends ProfileFormValues>({
  stepIndex,
  formik,
  options,
}: ProfileStepProps<T>) {
  const theme = useTheme()
  const linkColor = theme.palette.primary.main

  switch (stepIndex) {
    // ---- Personal Info ----
    case 0:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && (formik.errors.firstName as string)}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && (formik.errors.lastName as string)}
              required
            />
          </Box>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && (formik.errors.phone as string)}
            required
          />
          {options?.email && (
            <TextField
              fullWidth
              label="Email"
              value={options.email}
              disabled
              helperText="Email from your Google account"
            />
          )}
        </Box>
      )

    // ---- Address ----
    case 1:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Address Line 1"
            name="addressLine1"
            value={formik.values.addressLine1}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
            helperText={formik.touched.addressLine1 && (formik.errors.addressLine1 as string)}
            required
          />
          <TextField
            fullWidth
            label="Address Line 2"
            name="addressLine2"
            value={formik.values.addressLine2}
            onChange={formik.handleChange}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && (formik.errors.city as string)}
              required
            />
            <TextField
              fullWidth
              label="County"
              name="county"
              value={formik.values.county}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.county && Boolean(formik.errors.county)}
              helperText={formik.touched.county && (formik.errors.county as string)}
              required
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Postcode"
              name="postcode"
              value={formik.values.postcode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.postcode && Boolean(formik.errors.postcode)}
              helperText={formik.touched.postcode && (formik.errors.postcode as string)}
              required
            />
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.country && Boolean(formik.errors.country)}
              helperText={formik.touched.country && (formik.errors.country as string)}
              required
            />
          </Box>
        </Box>
      )

    // ---- About You ----
    case 2:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Interests, Skills or Qualifications"
            name="interestsSkills"
            value={formik.values.interestsSkills}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.interestsSkills && Boolean(formik.errors.interestsSkills)}
            helperText={
              (formik.touched.interestsSkills && (formik.errors.interestsSkills as string)) ||
              'Tell us about your background and what you can bring to the hackspace'
            }
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                name="hadTour"
                checked={formik.values.hadTour}
                onChange={formik.handleChange}
              />
            }
            label="I have had a guided tour of the hackspace"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="What do you most want from Norwich Hackspace?"
            name="hackspaceGoals"
            value={formik.values.hackspaceGoals}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.hackspaceGoals && Boolean(formik.errors.hackspaceGoals)}
            helperText={
              formik.touched.hackspaceGoals && (formik.errors.hackspaceGoals as string)
            }
            required
          />
          <FormControl
            error={
              formik.touched.shareDetailsWithMembers &&
              Boolean(formik.errors.shareDetailsWithMembers)
            }
          >
            <FormLabel>Can we share your contact details with other members?</FormLabel>
            <RadioGroup
              name="shareDetailsWithMembers"
              value={formik.values.shareDetailsWithMembers}
              onChange={formik.handleChange}
              row
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
              <FormControlLabel value="discuss" control={<Radio />} label="Let's discuss" />
            </RadioGroup>
            {formik.touched.shareDetailsWithMembers &&
              formik.errors.shareDetailsWithMembers && (
                <FormHelperText>
                  {formik.errors.shareDetailsWithMembers as string}
                </FormHelperText>
              )}
          </FormControl>
          <TextField
            fullWidth
            label="How did you hear about us?"
            name="referralSource"
            value={formik.values.referralSource}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.referralSource && Boolean(formik.errors.referralSource)}
            helperText={
              formik.touched.referralSource && (formik.errors.referralSource as string)
            }
            required
          />
        </Box>
      )

    // ---- Emergency Contact ----
    case 3:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Emergency Contact Information
          </Typography>
          <TextField
            fullWidth
            label="Contact Name"
            name="emergencyContactName"
            value={formik.values.emergencyContactName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.emergencyContactName &&
              Boolean(formik.errors.emergencyContactName)
            }
            helperText={
              formik.touched.emergencyContactName &&
              (formik.errors.emergencyContactName as string)
            }
            required
          />
          <TextField
            fullWidth
            label="Relationship to You"
            name="emergencyContactRelationship"
            value={formik.values.emergencyContactRelationship}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.emergencyContactRelationship &&
              Boolean(formik.errors.emergencyContactRelationship)
            }
            helperText={
              formik.touched.emergencyContactRelationship &&
              (formik.errors.emergencyContactRelationship as string)
            }
            placeholder="e.g. Partner, Parent, Friend"
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="emergencyContactMobile"
              value={formik.values.emergencyContactMobile}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.emergencyContactMobile &&
                Boolean(formik.errors.emergencyContactMobile)
              }
              helperText={
                formik.touched.emergencyContactMobile &&
                (formik.errors.emergencyContactMobile as string)
              }
              required
            />
            <TextField
              fullWidth
              label="Landline (Optional)"
              name="emergencyContactLandline"
              value={formik.values.emergencyContactLandline}
              onChange={formik.handleChange}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
            label="I have disabilities or medical conditions the hackspace should be aware of"
          />
          {formik.values.hasMedicalConditions && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Please provide details"
              name="medicalConditionsDetails"
              value={formik.values.medicalConditionsDetails}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.medicalConditionsDetails &&
                Boolean(formik.errors.medicalConditionsDetails)
              }
              helperText={
                (formik.touched.medicalConditionsDetails &&
                  (formik.errors.medicalConditionsDetails as string)) ||
                'This information will be kept confidential and only used in emergencies'
              }
              required
            />
          )}
        </Box>
      )

    // ---- Agreements ----
    case 4:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Please read and agree to the following:
          </Typography>

          <FormControl
            error={formik.touched.acceptedPolicies && Boolean(formik.errors.acceptedPolicies)}
          >
            <FormControlLabel
              control={
                <Checkbox
                  name="acceptedPolicies"
                  checked={formik.values.acceptedPolicies}
                  onChange={formik.handleChange}
                />
              }
              label={
                <Typography variant="body2">
                  I have read and understood the{' '}
                  <a
                    href="https://wiki.norwichhackspace.org/index.php?title=Rules_of_Engagement"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: linkColor }}
                  >
                    Rules of Engagement
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://wiki.norwichhackspace.org/index.php?title=Safety"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: linkColor }}
                  >
                    Safety Policies
                  </a>
                </Typography>
              }
            />
            {formik.touched.acceptedPolicies && formik.errors.acceptedPolicies && (
              <FormHelperText>{formik.errors.acceptedPolicies as string}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            error={
              formik.touched.acceptedSafetyResponsibility &&
              Boolean(formik.errors.acceptedSafetyResponsibility)
            }
          >
            <FormControlLabel
              control={
                <Checkbox
                  name="acceptedSafetyResponsibility"
                  checked={formik.values.acceptedSafetyResponsibility}
                  onChange={formik.handleChange}
                />
              }
              label="I understand that I am responsible for my own safety whilst at the hackspace"
            />
            {formik.touched.acceptedSafetyResponsibility &&
              formik.errors.acceptedSafetyResponsibility && (
                <FormHelperText>
                  {formik.errors.acceptedSafetyResponsibility as string}
                </FormHelperText>
              )}
          </FormControl>

          <FormControl error={formik.touched.isOver18 && Boolean(formik.errors.isOver18)}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isOver18"
                  checked={formik.values.isOver18}
                  onChange={formik.handleChange}
                />
              }
              label="I confirm that I am over 18 years of age"
            />
            {formik.touched.isOver18 && formik.errors.isOver18 && (
              <FormHelperText>{formik.errors.isOver18 as string}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            error={
              formik.touched.standingOrderConfirmed &&
              Boolean(formik.errors.standingOrderConfirmed)
            }
          >
            <FormControlLabel
              control={
                <Checkbox
                  name="standingOrderConfirmed"
                  checked={formik.values.standingOrderConfirmed}
                  onChange={formik.handleChange}
                />
              }
              label="I have set up a standing order for a minimum of £15/month"
            />
            {formik.touched.standingOrderConfirmed &&
              formik.errors.standingOrderConfirmed && (
                <FormHelperText>
                  {formik.errors.standingOrderConfirmed as string}
                </FormHelperText>
              )}
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Communication Preferences (Optional)
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
        </Box>
      )

    default:
      return null
  }
}
