/** Stagione API (2024) → etichetta leggibile "2024/25". */
export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, '0')}`
}

/** Numero con decimali fissi nella lingua corrente; null/undefined diventano un trattino tipografico. */
export function formatNumber(value: number | null | undefined, locale: string, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(
    value,
  )
}

export function formatDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function initials(name: string): string {
  const parts = name.replace(/[.]/g, ' ').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
