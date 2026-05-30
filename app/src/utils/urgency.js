import { daysFromToday } from './dates.js'

export const CLAIM_WINDOW_DAYS = 30

export function computeUrgency(req) {
  const estado = req['Estado']
  const vencimiento = req['Vencimiento']
  const daysToDeadline = daysFromToday(vencimiento)

  if (estado === 'En tramitación') {
    if (daysToDeadline === null) return { level: 'neutral', label: 'Sin plazo', order: 4 }
    if (daysToDeadline < 0) {
      const daysIntoClaimWindow = CLAIM_WINDOW_DAYS + daysToDeadline
      if (daysIntoClaimWindow <= 7) return { level: 'critical', label: `¡Reclamar! ${daysIntoClaimWindow}d`, order: 0 }
      if (daysIntoClaimWindow <= 15) return { level: 'critical', label: `Reclamar: ${daysIntoClaimWindow}d`, order: 1 }
      return { level: 'warning', label: `Silencio: ${daysIntoClaimWindow}d`, order: 2 }
    }
    if (daysToDeadline <= 7) return { level: 'critical', label: `Vence: ${daysToDeadline}d`, order: 1 }
    if (daysToDeadline <= 15) return { level: 'warning', label: `Vence: ${daysToDeadline}d`, order: 2 }
    if (daysToDeadline <= 30) return { level: 'warning', label: `Vence: ${daysToDeadline}d`, order: 3 }
    return { level: 'ok', label: `Vence: ${daysToDeadline}d`, order: 3 }
  }

  if (estado === 'Reclamada') return { level: 'neutral', label: 'Reclamada', order: 4 }
  if (estado === 'Contencioso') return { level: 'neutral', label: 'Judicial', order: 5 }

  return { level: 'neutral', label: estado || '—', order: 6 }
}

export function getDailyDigestCategories(requests) {
  const silencio = requests.filter(r => {
    if (r['Estado'] !== 'En tramitación') return false
    const days = daysFromToday(r['Vencimiento'])
    return days !== null && days < 0
  })
  const reclamadas = requests.filter(r => r['Estado'] === 'Reclamada')
  const contencioso = requests.filter(r => r['Estado'] === 'Contencioso')
  return { silencio, reclamadas, contencioso }
}

export function enrichRequests(rawRequests) {
  return rawRequests.map(r => {
    const urgency = computeUrgency(r)
    return {
      ...r,
      urgencyLevel: urgency.level,
      urgencyLabel: urgency.label,
      urgencyOrder: urgency.order,
      daysUntilDeadline: daysFromToday(r['Vencimiento']),
    }
  })
}
