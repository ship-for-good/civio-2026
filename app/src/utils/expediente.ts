import type { RawRequest, EnrichedRequest } from './urgency.js'

export const ESTADOS = ['Solicitado', 'En tramitación', 'Reclamada', 'Contencioso', 'Resuelta'] as const
export type Estado = typeof ESTADOS[number]

export interface ExpedienteRecord {
  id: string
  asunto: string
  estado: string
  fecha: string
  vencimiento: string | null
  autor: string
  attachments: string[]
  notas?: string
}

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

export interface ExpedienteEditInput {
  asunto?: string
  estado?: string
  vencimiento?: string
  notas?: string
}

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<string, string>>
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
  const base = Object.fromEntries(CSV_KEYS.map(k => [k, ''])) as unknown as RawRequest

  return {
    ...base,
    'Id': (input.numeroExpediente ?? '').trim(),
    'Asunto': (input.asunto ?? '').trim(),
    'Estado': 'En tramitación',
    'Fecha': today,
    'Autor': options.autor ?? '',
  }
}

export function expedienteRecordToRaw(record: ExpedienteRecord): RawRequest {
  const base = Object.fromEntries(CSV_KEYS.map(k => [k, ''])) as unknown as RawRequest
  return {
    ...base,
    'Id': record.id,
    'Asunto': record.asunto,
    'Estado': record.estado,
    'Fecha': record.fecha,
    'Vencimiento': record.vencimiento ?? '',
    'Autor': record.autor,
    'Notas': record.notas ?? '',
    attachments: record.attachments ?? [],
  }
}

export function mergeById(
  csvRows: EnrichedRequest[],
  supabaseRows: EnrichedRequest[],
): EnrichedRequest[] {
  const supabaseById = new Map(supabaseRows.map(r => [r['Id'], r]))
  const merged = csvRows.map(r => supabaseById.get(r['Id']) ?? r)
  const csvIds = new Set(csvRows.map(r => r['Id']))
  const added = supabaseRows.filter(r => !csvIds.has(r['Id']))
  return [...added, ...merged]
}

export function validateExpedienteEdit(input: ExpedienteEditInput): ValidationResult {
  const errors: Partial<Record<string, string>> = {}

  if (!(input.asunto ?? '').trim()) {
    errors.asunto = 'El asunto es obligatorio'
  }

  if (input.estado !== undefined && !(ESTADOS as readonly string[]).includes(input.estado)) {
    errors.estado = `El estado debe ser uno de: ${ESTADOS.join(', ')}`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function applyEdit(req: RawRequest, input: ExpedienteEditInput): RawRequest {
  return {
    ...req,
    'Asunto': (input.asunto ?? req['Asunto']),
    'Estado': (input.estado ?? req['Estado']),
    'Vencimiento': (input.vencimiento ?? req['Vencimiento']),
    'Notas': (input.notas ?? req['Notas']),
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
