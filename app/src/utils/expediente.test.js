import { describe, it, expect } from 'vitest'
import { validateExpediente, buildExpediente, slugifyFilename } from './expediente.js'
import { enrichRequests } from './urgency.js'

// ─────────────────────────────────────────────
// validateExpediente
// ─────────────────────────────────────────────
describe('validateExpediente', () => {
  const existingIds = ['EXP-001', 'EXP-002']

  it('should_reject_empty_numero_expediente', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: '', asunto: 'Test' }, existingIds)
    expect(valid).toBe(false)
    expect(errors.numeroExpediente).toBeTruthy()
  })

  it('should_reject_whitespace_only_numero_expediente', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: '   ', asunto: 'Test' }, existingIds)
    expect(valid).toBe(false)
    expect(errors.numeroExpediente).toBeTruthy()
  })

  it('should_reject_empty_asunto', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: 'EXP-099', asunto: '' }, existingIds)
    expect(valid).toBe(false)
    expect(errors.asunto).toBeTruthy()
  })

  it('should_reject_duplicate_id_when_numero_exists_in_existingIds', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: 'EXP-001', asunto: 'Test' }, existingIds)
    expect(valid).toBe(false)
    expect(errors.numeroExpediente).toMatch(/exist/i)
  })

  it('should_trim_numero_before_uniqueness_check', () => {
    const { valid } = validateExpediente({ numeroExpediente: ' EXP-001 ', asunto: 'Test' }, existingIds)
    expect(valid).toBe(false)
  })

  it('should_accept_valid_unique_input', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: 'EXP-099', asunto: 'Nuevo asunto' }, existingIds)
    expect(valid).toBe(true)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('should_return_all_errors_when_both_fields_missing', () => {
    const { valid, errors } = validateExpediente({ numeroExpediente: '', asunto: '' }, existingIds)
    expect(valid).toBe(false)
    expect(errors.numeroExpediente).toBeTruthy()
    expect(errors.asunto).toBeTruthy()
  })
})

// ─────────────────────────────────────────────
// buildExpediente
// ─────────────────────────────────────────────
describe('buildExpediente', () => {
  const TODAY = '2026-05-30'
  const input = { numeroExpediente: 'EXP-099', asunto: 'Solicitud de datos presupuestarios' }
  const options = { autor: 'javier@civio.es' }

  it('should_map_numeroExpediente_to_Id', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Id']).toBe('EXP-099')
  })

  it('should_map_asunto_to_Asunto', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Asunto']).toBe('Solicitud de datos presupuestarios')
  })

  it('should_default_estado_to_en_tramitacion', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Estado']).toBe('En tramitación')
  })

  it('should_set_fecha_to_provided_today', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Fecha']).toBe('2026-05-30')
  })

  it('should_leave_vencimiento_empty', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Vencimiento']).toBe('')
  })

  it('should_default_autor_to_provided_email', () => {
    const req = buildExpediente(input, TODAY, options)
    expect(req['Autor']).toBe('javier@civio.es')
  })

  it('should_default_other_csv_keys_to_empty_string', () => {
    const req = buildExpediente(input, TODAY, options)
    const defaultedKeys = [
      'Ámbito', 'Ministerio', 'Inicio tramitación',
      'Art 20.1 (volumen)', 'Vencimiento normal', 'Vencimiento 20.1',
      'Resolución', 'Notificación', 'Días para respuesta',
      'Días para reclamar por silencio administrativo', 'Días para reclamar resolución',
      'Notas', 'Reclamación',
    ]
    for (const key of defaultedKeys) {
      expect(req[key]).toBe('')
    }
  })

  it('should_produce_sin_plazo_urgency_when_enriched', () => {
    const raw = buildExpediente(input, TODAY, options)
    const [enriched] = enrichRequests([raw])
    expect(enriched.urgencyLabel).toBe('Sin plazo')
    expect(enriched.urgencyOrder).toBe(4)
    expect(enriched.daysUntilDeadline).toBeNull()
  })

  it('should_trim_numeroExpediente_before_assigning_to_Id', () => {
    const req = buildExpediente({ ...input, numeroExpediente: '  EXP-099  ' }, TODAY, options)
    expect(req['Id']).toBe('EXP-099')
  })
})

// ─────────────────────────────────────────────
// slugifyFilename
// ─────────────────────────────────────────────
describe('slugifyFilename', () => {
  it('should_strip_spaces_and_accents_from_filename', () => {
    expect(slugifyFilename('Solicitud número 1.pdf')).toBe('Solicitud_numero_1.pdf')
  })

  it('should_preserve_extension', () => {
    expect(slugifyFilename('informe final.xlsx')).toBe('informe_final.xlsx')
  })

  it('should_handle_filename_without_spaces', () => {
    expect(slugifyFilename('doc.pdf')).toBe('doc.pdf')
  })
})
