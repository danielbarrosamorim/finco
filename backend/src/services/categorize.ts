import { AutoRule } from '../types'

interface CategoryMatch {
  category: string
  subcategory: string | null
}

export function categorize(
  description: string,
  rules: AutoRule[]
): CategoryMatch | null {
  const lower = description.toLowerCase()

  for (const rule of rules) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
      }
    }
  }

  return null
}
