export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export function parseDate(str: string | null | undefined): Date | null {
  if (!str || str.trim() === '') return null
  const d = new Date(str.trim() + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

export function daysFromToday(dateStr: string | null | undefined): number | null {
  const d = parseDate(dateStr)
  if (!d) return null
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}
