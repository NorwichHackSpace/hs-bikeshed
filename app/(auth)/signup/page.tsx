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
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuthStore } from '@/stores'
import {
  type ProfileFormValues,
  PROFILE_STEPS,
  profileInitialValues,
  profileValidationSchema,
  profileStepFields,
  ProfileStep,
} from '@/components/auth/MembershipFormSteps'

const STEPS = ['Account', ...PROFILE_STEPS]

interface SignupFormValues extends ProfileFormValues {
  email: string
  password: string
  confirmPassword: string
}

const validationSchema = profileValidationSchema.concat(
  Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  })
)

// Fields to validate per step
const stepFields: (keyof SignupFormValues)[][] = [
  ['email', 'password', 'confirmPassword'],
  ...profileStepFields,
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
      ...profileInitialValues,
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

      default:
        return <ProfileStep stepIndex={activeStep - 1} formik={formik} />
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
