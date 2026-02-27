export function isProfileComplete(profile: {
  first_name?: string | null
  emergency_contact_name?: string | null
  accepted_policies?: boolean | null
}): boolean {
  return Boolean(
    profile.first_name &&
    profile.emergency_contact_name &&
    profile.accepted_policies
  )
}
