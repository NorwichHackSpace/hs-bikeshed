/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Convert a slug back to a display name (best effort)
 */
export function unslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Category mappings for URL routing
 */
export const EQUIPMENT_CATEGORIES = [
  'Laser Cutting',
  '3D Printing',
  'Woodworking',
  'Metalworking',
  'Electronics',
  'Textiles',
  'CNC',
  'Hand Tools',
  'Other',
] as const

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number]

/**
 * Get the URL-safe slug for a category
 */
export function getCategorySlug(category: string | null): string {
  return category ? slugify(category) : 'uncategorized'
}

/**
 * Find the original category name from a slug
 */
export function getCategoryFromSlug(slug: string): string | null {
  if (slug === 'uncategorized') return null

  const found = EQUIPMENT_CATEGORIES.find(
    (cat) => slugify(cat) === slug
  )
  return found ?? null
}
