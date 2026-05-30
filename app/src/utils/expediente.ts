import type { RawRequest } from './urgency.js'

const CSV_KEYS: (keyof RawRequest)[] = [
  'Id', 'Ámbito', 'Fecha', 'Estado', 'Asunto', 'Ministerio',
  'Inicio tramitación', 'Art 20.1 (volumen)', 'Vencimiento normal',
  'Vencimiento 20.1', 'Vencimiento', 'Resolución', 'Notificación',
  'Días para respuesta', 'Días para reclamar por silencio administrativo',
  'Días para reclamar resolución', 'Notas', 'Autor', 'Reclamación',
]

export interface ExpedienteInput {
  numeroExpediente?: string
  asunto?: string
}

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<keyof ExpedienteInput, string>>
}

export function validateExpediente(input: ExpedienteInput, existingIds: string[]): ValidationResult {
  const errors: Partial<Record<keyof ExpedienteInput, string>> = {}
  const trimmedId = (input.numeroExpediente ?? '').trim()

  if (!trimmedId) {
    errors.numeroExpediente = 'El número de expediente es obligatorio'
  } else if (existingIds.includes(trimmedId)) {
    errors.numeroExpediente = 'Ya existe un expediente con ese número'
  }

  if (!(input.asunto ?? '').trim()) {
    errors.asunto = 'El asunto es obligatorio'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function buildExpediente(
  input: ExpedienteInput,
  today: string,
  options: { autor?: string } = {},
): RawRequest {
  const base = Object.fromEntries(CSV_KEYS.map(k => [k, ''])) as RawRequest

  return {
    ...base,
    'Id': (input.numeroExpediente ?? '').trim(),
    'Asunto': (input.asunto ?? '').trim(),
    'Estado': 'En tramitación',
    'Fecha': today,
    'Autor': options.autor ?? '',
  }
}

export function slugifyFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const hasExt = lastDot > 0
  const name = hasExt ? filename.slice(0, lastDot) : filename
  const ext = hasExt ? filename.slice(lastDot) : ''

  const safeName = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '')

  return safeName + ext
}
