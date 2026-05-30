export const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export function parseDate(str) {
  if (!str || str.trim() === '') return null
  const d = new Date(str.trim() + 'T00:00:00')
  return isNaN(d) ? null : d
}

export function daysFromToday(dateStr) {
  const d = parseDate(dateStr)
  if (!d) return null
  return Math.round((d - TODAY) / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr) {
  const d = parseDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  const d = parseDate(dateStr)
  if (!d) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}
