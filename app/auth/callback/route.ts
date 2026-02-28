import { createClient } from '@/lib/supabase/server'
import { isProfileComplete } from '@/lib/profileValidation'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/members/equipment'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, emergency_contact_name, accepted_policies')
          .eq('id', user.id)
          .single()

        // If no profile or profile is incomplete, redirect to complete profile
        if (!profile || !isProfileComplete(profile)) {
          return NextResponse.redirect(`${origin}/complete-profile`)
        }

        // Check if user has any roles (approved membership)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        // If no roles, redirect to pending approval
        if (!roles || roles.length === 0) {
          return NextResponse.redirect(`${origin}/pending-approval`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
