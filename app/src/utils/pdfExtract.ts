import type { PDFDocumentProxy } from 'pdfjs-dist'

// ── Lazy imports for heavy deps (pdfjs-dist, tesseract.js) ─────────────
// Loaded on demand so they don't bloat the initial bundle.
async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  // Vite ?url import for the worker (configured at call-time, not module-load-time)
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

async function loadTesseract() {
  return import('tesseract.js')
}

// ── Pure parser (no I/O — fully unit-testable) ─────────────────────────

export interface PdfExtractResult {
  numeroExpediente?: string
  asunto?: string
}

/**
 * Extracts Nº expediente and Asunto from the plain text of a transparency
 * request receipt ("Justificante de registro").
 *
 * Tolerates OCR noise in the "Nº" prefix (Nº / N° / No).
 * The expediente number may follow the label on the SAME line (after ":")
 * or on the NEXT non-empty line (as in the scanned Civio PDFs).
 */
export function parseExpedienteFromText(text: string): PdfExtractResult {
  const result: PdfExtractResult = {}

  // ── Nº EXPEDIENTE ──────────────────────────────────────────────────
  // Tolerates OCR noise in the "Nº" prefix: N° / Nº / No / N2 / N0 / N. / etc.
  const expedienteRe = /N\S{0,2}\s*EXPEDIENTE\s*:?\s*([^\n\r]*)/i
  const expedienteMatch = expedienteRe.exec(text)
  if (expedienteMatch) {
    // An expediente ID always contains a digit or underscore and is longer than 4 chars.
    // This filters out OCR column-bleed ("NOMBRE:", "ARANTXA") and stray artefacts ("v").
    const isId = (s: string) => s.length > 4 && /[\d_]/.test(s) && !s.endsWith(':')
    const findId = (s: string) => s.trim().split(/\s+/).find(isId)

    const sameLineId = findId(expedienteMatch[1])
    if (sameLineId) {
      result.numeroExpediente = sameLineId
    } else {
      // Look at subsequent lines; skip artefact-only lines (e.g. "v")
      const afterLabel = text.slice(expedienteMatch.index + expedienteMatch[0].length)
      for (const line of afterLabel.split(/[\n\r]+/)) {
        const id = findId(line)
        if (id) { result.numeroExpediente = id; break }
      }
    }
  }

  // ── Asunto ─────────────────────────────────────────────────────────
  const asuntoRe = /Asunto\s*:\s*([^\n\r]+)/i
  const asuntoMatch = asuntoRe.exec(text)
  if (asuntoMatch) {
    // Strip trailing whitespace and stray punctuation (e.g. trailing ". " from scans)
    const raw = asuntoMatch[1].trim().replace(/[\s.]+$/, '')
    if (raw) result.asunto = raw
  }

  return result
}

// ── I/O wrapper (NOT unit-tested — depends on browser APIs + heavy deps) ──

const MIN_TEXT_LENGTH = 20

/**
 * Extracts plain text from a PDF file.
 * Strategy:
 *   1. Try the text layer via pdf.js (fast, exact for digital PDFs).
 *   2. If the layer is empty/thin (scanned PDF), fall back to OCR via tesseract.js.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  // ── Attempt 1: text layer ──────────────────────────────────────────
  const textContent = await page.getTextContent()
  const layerText = textContent.items
    .filter(item => 'str' in item)
    .map(item => (item as { str: string }).str)
    .join(' ')
    .trim()

  if (layerText.length >= MIN_TEXT_LENGTH) {
    return layerText
  }

  // ── Attempt 2: OCR fallback ────────────────────────────────────────
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  const tesseract = await loadTesseract()
  const worker = await tesseract.createWorker('spa')
  try {
    const { data } = await worker.recognize(canvas)
    return data.text
  } finally {
    await worker.terminate()
  }
}
