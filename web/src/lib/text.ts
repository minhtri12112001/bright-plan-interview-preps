const COMBINING_MARKS = /[̀-ͯ]/g
const WHITESPACE_RUN = /\s+/g

/**
 * Canonical form used for search comparisons: trimmed, single-spaced,
 * diacritic-free and lowercase. "  Ân   Nguyễn " -> "an nguyen".
 */
export function normalizeText(value: string): string {
  return value
    .trim()
    .replace(WHITESPACE_RUN, ' ')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    // "đ" is a distinct letter, not d + a combining mark, so NFD leaves it alone.
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/** Up to two uppercase initials for an avatar fallback. "Ava Chen" -> "AC". */
export function getInitials(name: string): string {
  const words = name.trim().split(WHITESPACE_RUN).filter(Boolean)
  if (words.length === 0) return '?'

  const first = words[0]
  const last = words.length > 1 ? words[words.length - 1] : ''
  return (Array.from(first)[0] + (Array.from(last)[0] ?? '')).toUpperCase()
}

/** "1 person" / "3 people". */
export function formatPeopleCount(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`
}
