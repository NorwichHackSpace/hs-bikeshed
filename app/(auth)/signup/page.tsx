'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  alpha,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuthStore } from '@/stores'
import type { SignupProfileData } from '@/stores/authStore'

const STEPS = [
  'Account',
  'Personal Info',
  'Address',
  'About You',
  'Emergency Contact',
  'Agreements',
]

interface SignupFormValues extends SignupProfileData {
  email: string
  password: string
  confirmPassword: string
}

const validationSchema = Yup.object({
  // Step 1: Account
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),

  // Step 2: Personal Info
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone number is required'),

  // Step 3: Address
  addressLine1: Yup.string().required('Address is required'),
  addressLine2: Yup.string(),
  city: Yup.string().required('City is required'),
  county: Yup.string().required('County is required'),
  postcode: Yup.string().required('Postcode is required'),
  country: Yup.string().required('Country is required'),

  // Step 4: About You
  interestsSkills: Yup.string().required('Please tell us about your interests and skills'),
  hadTour: Yup.boolean(),
  hackspaceGoals: Yup.string().required('Please tell us what you hope to get from the hackspace'),
  shareDetailsWithMembers: Yup.string()
    .oneOf(['yes', 'no', 'discuss'])
    .required('Please select an option'),
  referralSource: Yup.string().required('Please tell us how you heard about us'),

  // Step 5: Emergency Contact
  emergencyContactName: Yup.string().required('Emergency contact name is required'),
  emergencyContactRelationship: Yup.string().required('Relationship is required'),
  emergencyContactMobile: Yup.string().required('Mobile number is required'),
  emergencyContactLandline: Yup.string(),
  hasMedicalConditions: Yup.boolean(),
  medicalConditionsDetails: Yup.string().when('hasMedicalConditions', {
    is: true,
    then: (schema) => schema.required('Please provide details of your medical conditions'),
  }),

  // Step 6: Agreements
  acceptedPolicies: Yup.boolean()
    .oneOf([true], 'You must read and accept the policies')
    .required(),
  acceptedSafetyResponsibility: Yup.boolean()
    .oneOf([true], 'You must accept responsibility for your own safety')
    .required(),
  isOver18: Yup.boolean()
    .oneOf([true], 'You must be over 18 to join')
    .required(),
  standingOrderConfirmed: Yup.boolean()
    .oneOf([true], 'You must set up a standing order')
    .required(),
  optInCommunications: Yup.boolean(),
  optInMarketing: Yup.boolean(),
})

// Fields to validate per step
const stepFields: (keyof SignupFormValues)[][] = [
  ['email', 'password', 'confirmPassword'],
  ['firstName', 'lastName', 'phone'],
  ['addressLine1', 'city', 'county', 'postcode', 'country'],
  ['interestsSkills', 'hackspaceGoals', 'shareDetailsWithMembers', 'referralSource'],
  ['emergencyContactName', 'emergencyContactRelationship', 'emergencyContactMobile'],
  ['acceptedPolicies', 'acceptedSafetyResponsibility', 'isOver18', 'standingOrderConfirmed'],
]

export default function SignupPage() {
  const { signUp, loading, error } = useAuthStore()
  const [activeStep, setActiveStep] = useState(0)
  const [success, setSuccess] = useState(false)

  const formik = useFormik<SignupFormValues>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
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
    },
    validationSchema,
    onSubmit: async (values) => {
      const { email, password, confirmPassword: _, ...profileData } = values
      try {
        await signUp(email, password, profileData)
        setSuccess(true)
      } catch {
        // Error is handled by store
      }
    },
  })

  const validateStep = async () => {
    const fields = stepFields[activeStep]
    const errors = await formik.validateForm()

    // Touch all fields in current step
    const touchedFields: Record<string, boolean> = {}
    fields.forEach((field) => {
      touchedFields[field] = true
    })
    formik.setTouched({ ...formik.touched, ...touchedFields })

    // Check if any current step fields have errors
    return !fields.some((field) => errors[field])
  }

  const handleNext = async () => {
    const isValid = await validateStep()
    if (isValid) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1f37 0%, #0f1225 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #17AD37 0%, #4caf50 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CheckCircleIcon sx={{ color: 'white', fontSize: 40 }} />
              </Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Check your email
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                We&apos;ve sent you a confirmation link. Please check your email to
                complete your registration.
              </Typography>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outlined">Back to Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </Container>
      </Box>
    )
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={
                (formik.touched.password && formik.errors.password) ||
                'At least 6 characters'
              }
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              required
            />
          </Box>
        )

      case 1:
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
                helperText={formik.touched.firstName && formik.errors.firstName}
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
                helperText={formik.touched.lastName && formik.errors.lastName}
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
              helperText={formik.touched.phone && formik.errors.phone}
              required
            />
          </Box>
        )

      case 2:
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
              helperText={formik.touched.addressLine1 && formik.errors.addressLine1}
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
                helperText={formik.touched.city && formik.errors.city}
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
                helperText={formik.touched.county && formik.errors.county}
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
                helperText={formik.touched.postcode && formik.errors.postcode}
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
                helperText={formik.touched.country && formik.errors.country}
                required
              />
            </Box>
          </Box>
        )

      case 3:
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
                (formik.touched.interestsSkills && formik.errors.interestsSkills) ||
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
              helperText={formik.touched.hackspaceGoals && formik.errors.hackspaceGoals}
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
              {formik.touched.shareDetailsWithMembers && formik.errors.shareDetailsWithMembers && (
                <FormHelperText>{formik.errors.shareDetailsWithMembers}</FormHelperText>
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
              helperText={formik.touched.referralSource && formik.errors.referralSource}
              required
            />
          </Box>
        )

      case 4:
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
                formik.touched.emergencyContactName && formik.errors.emergencyContactName
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
                formik.errors.emergencyContactRelationship
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
                  formik.touched.emergencyContactMobile && formik.errors.emergencyContactMobile
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
                    formik.errors.medicalConditionsDetails) ||
                  'This information will be kept confidential and only used in emergencies'
                }
                required
              />
            )}
          </Box>
        )

      case 5:
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
                      style={{ color: '#1A73E8' }}
                    >
                      Rules of Engagement
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://wiki.norwichhackspace.org/index.php?title=Safety"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1A73E8' }}
                    >
                      Safety Policies
                    </a>
                  </Typography>
                }
              />
              {formik.touched.acceptedPolicies && formik.errors.acceptedPolicies && (
                <FormHelperText>{formik.errors.acceptedPolicies}</FormHelperText>
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
                  <FormHelperText>{formik.errors.acceptedSafetyResponsibility}</FormHelperText>
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
                <FormHelperText>{formik.errors.isOver18}</FormHelperText>
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
              {formik.touched.standingOrderConfirmed && formik.errors.standingOrderConfirmed && (
                <FormHelperText>{formik.errors.standingOrderConfirmed}</FormHelperText>
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f37 0%, #0f1225 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(26, 115, 232, 0.3)',
            }}
          >
            <HomeIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
            Join Norwich Hackspace
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.7) }}>
            Complete the membership form to become a member
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              {renderStepContent()}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                {activeStep === STEPS.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || formik.isSubmitting}
                  >
                    {loading ? 'Creating account...' : 'Complete Registration'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            </form>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Already have an account?{' '}
              <Link
                href="/login"
                style={{
                  color: '#1A73E8',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
