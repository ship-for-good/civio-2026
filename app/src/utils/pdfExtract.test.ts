import { describe, expect, it } from 'vitest'
import { parseExpedienteFromText } from './pdfExtract.js'

// Texto aproximado del "Justificante de registro" de Civio:
// el Nº de expediente va en la línea siguiente a la etiqueta "Nº EXPEDIENTE:"
const FIXTURE_JUSTIFICANTE = `
Nº EXPEDIENTE:
ES_E04996103_2026_EXP_AC2000000771490
FECHA EXPEDIENTE: 30/05/2026
Nº REGISTRO REGAGE: REGAGE26e00051620261
FECHA REGISTRO: 30/05/2026

Justificante de registro

Procedimiento:
Ejercicio del derecho de acceso a información pública

Asunto: Justificante de registro .
Tipo de Asunto: SALIDA
`

describe('parseExpedienteFromText', () => {
  it('should_extract_numero_expediente_when_value_is_on_next_line', () => {
    const result = parseExpedienteFromText(FIXTURE_JUSTIFICANTE)

    expect(result.numeroExpediente).toBe('ES_E04996103_2026_EXP_AC2000000771490')
  })

  it('should_extract_numero_expediente_when_value_is_on_same_line_after_colon', () => {
    const text = 'Nº EXPEDIENTE: EXP-2026-001\nOtro campo: algo'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('EXP-2026-001')
  })

  it('should_extract_asunto_trimming_trailing_punctuation', () => {
    const result = parseExpedienteFromText(FIXTURE_JUSTIFICANTE)

    expect(result.asunto).toBe('Justificante de registro')
  })

  it('should_return_empty_object_when_no_matches', () => {
    const result = parseExpedienteFromText('Texto sin campos relevantes aquí')

    expect(result).toEqual({})
  })

  it('should_tolerate_ocr_variant_N_degree_sign_for_numero_expediente', () => {
    const text = 'N° EXPEDIENTE:\nEXP-OCR-2026'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('EXP-OCR-2026')
  })

  it('should_tolerate_ocr_variant_No_for_numero_expediente', () => {
    const text = 'No EXPEDIENTE: EXP-NO-2026'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('EXP-NO-2026')
  })

  it('should_tolerate_ocr_variant_N2_for_numero_expediente', () => {
    const text = 'N2 EXPEDIENTE: EXP-N2-2026'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('EXP-N2-2026')
  })

  it('should_tolerate_ocr_variant_N0_for_numero_expediente', () => {
    const text = 'N0 EXPEDIENTE:\nEXP-N0-2026'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('EXP-N0-2026')
  })

  it('should_ignore_nombre_field_when_ocr_merges_two_columns_on_same_line', () => {
    // OCR scans both side-by-side boxes as one line:
    // "N2 EXPEDIENTE: NOMBRE: ARANTXA MAGNELLI SANCHEZ"
    const text = 'N2 EXPEDIENTE: NOMBRE: ARANTXA MAGNELLI SANCHEZ\nES_E04996103_2026_EXP_AC2000000771490'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('ES_E04996103_2026_EXP_AC2000000771490')
  })

  it('should_skip_single_char_ocr_artefact_on_next_line', () => {
    // OCR sometimes inserts stray characters before the real ID
    const text = 'N2 EXPEDIENTE:\nv\nES_E04996103_2026_EXP_AC2000000771490'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBe('ES_E04996103_2026_EXP_AC2000000771490')
  })

  it('should_not_include_empty_fields_in_result', () => {
    const text = 'Texto sin número de expediente\nAsunto: Mi solicitud'

    const result = parseExpedienteFromText(text)

    expect(result.numeroExpediente).toBeUndefined()
    expect(result.asunto).toBe('Mi solicitud')
  })
})
