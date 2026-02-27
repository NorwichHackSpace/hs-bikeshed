'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  alpha,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useFormik } from 'formik'
import { getClient } from '@/lib/supabase/client'
import { isProfileComplete } from '@/lib/profileValidation'
import type { User } from '@supabase/supabase-js'
import {
  type ProfileFormValues,
  PROFILE_STEPS,
  profileInitialValues,
  profileValidationSchema,
  profileStepFields,
  ProfileStep,
} from '@/components/auth/MembershipFormSteps'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = getClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && isProfileComplete(profile)) {
        // Profile exists and is complete - check roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (roles && roles.length > 0) {
          router.push('/equipment')
        } else {
          router.push('/pending-approval')
        }
        return
      }

      // Pre-populate form with existing profile data if available
      if (profile) {
        formik.setValues({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          addressLine1: profile.address_line1 || '',
          addressLine2: profile.address_line2 || '',
          city: profile.city || '',
          county: profile.county || '',
          postcode: profile.postcode || '',
          country: profile.country || 'United Kingdom',
          interestsSkills: profile.interests_skills || '',
          hadTour: profile.had_tour || false,
          hackspaceGoals: profile.hackspace_goals || '',
          shareDetailsWithMembers: (profile.share_details_with_members as 'yes' | 'no' | 'discuss') || 'no',
          referralSource: profile.referral_source || '',
          emergencyContactName: profile.emergency_contact_name || '',
          emergencyContactRelationship: profile.emergency_contact_relationship || '',
          emergencyContactMobile: profile.emergency_contact_mobile || '',
          emergencyContactLandline: profile.emergency_contact_landline || '',
          hasMedicalConditions: profile.has_medical_conditions || false,
          medicalConditionsDetails: profile.medical_conditions_details || '',
          acceptedPolicies: profile.accepted_policies || false,
          acceptedSafetyResponsibility: profile.accepted_safety_responsibility || false,
          isOver18: profile.is_over_18 || false,
          standingOrderConfirmed: profile.standing_order_confirmed || false,
          optInCommunications: profile.opt_in_communications || false,
          optInMarketing: profile.opt_in_marketing || false,
        })
      }

      setUser(user)
      setLoading(false)
    }

    checkUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const formik = useFormik<ProfileFormValues>({
    initialValues: { ...profileInitialValues },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      if (!user) return

      setError(null)
      const supabase = getClient()

      try {
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: user.id,
          name: `${values.firstName} ${values.lastName}`.trim(),
          first_name: values.firstName,
          last_name: values.lastName,
          email: user.email,
          phone: values.phone,
          address_line1: values.addressLine1,
          address_line2: values.addressLine2 || null,
          city: values.city,
          county: values.county,
          postcode: values.postcode,
          country: values.country,
          interests_skills: values.interestsSkills,
          had_tour: values.hadTour,
          hackspace_goals: values.hackspaceGoals,
          share_details_with_members: values.shareDetailsWithMembers,
          accepted_policies: values.acceptedPolicies,
          accepted_safety_responsibility: values.acceptedSafetyResponsibility,
          is_over_18: values.isOver18,
          standing_order_confirmed: values.standingOrderConfirmed,
          has_medical_conditions: values.hasMedicalConditions,
          medical_conditions_details: values.medicalConditionsDetails || null,
          emergency_contact_name: values.emergencyContactName,
          emergency_contact_relationship: values.emergencyContactRelationship,
          emergency_contact_mobile: values.emergencyContactMobile,
          emergency_contact_landline: values.emergencyContactLandline || null,
          referral_source: values.referralSource,
          opt_in_communications: values.optInCommunications,
          opt_in_marketing: values.optInMarketing,
          membership_status: 'active',
          join_date: new Date().toISOString().split('T')[0],
        })

        if (insertError) throw insertError

        setSuccess(true)
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/pending-approval')
        }, 2000)
      } catch (err) {
        setError((err as Error).message)
      }
    },
  })

  const validateStep = async () => {
    const fields = profileStepFields[activeStep]
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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1f37 0%, #0f1225 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#F9B233' }} />
      </Box>
    )
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
              borderRadius: 3,
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
                Profile Complete!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Welcome to Norwich Hackspace! Your profile is being reviewed. Redirecting...
              </Typography>
              <CircularProgress size={24} sx={{ color: '#F9B233' }} />
            </CardContent>
          </Card>
        </Container>
      </Box>
    )
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
              background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(249, 178, 51, 0.3)',
            }}
          >
            <PersonAddIcon sx={{ color: '#000', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
            Complete Your Profile
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.7) }}>
            Please complete your membership details to continue
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {PROFILE_STEPS.map((label) => (
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
              <ProfileStep stepIndex={activeStep} formik={formik} options={{ email: user?.email }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                {activeStep === PROFILE_STEPS.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? 'Creating profile...' : 'Complete Profile'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
