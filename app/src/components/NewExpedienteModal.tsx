import { useEffect, useRef, useState } from 'react'
import { validateExpediente, type ExpedienteInput } from '../utils/expediente.js'
import { extractTextFromPdf, parseExpedienteFromText } from '../utils/pdfExtract.js'

interface NewExpedienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: ExpedienteInput, files: File[]) => Promise<void>
  existingIds: string[]
}

type Status = 'idle' | 'submitting' | 'error'
type Mode = 'upload' | 'manual'
type ParseStatus = 'idle' | 'parsing' | 'parsed' | 'parse-error'

export default function NewExpedienteModal({ isOpen, onClose, onSubmit, existingIds }: NewExpedienteModalProps) {
  const [mode, setMode] = useState<Mode>('upload')
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle')
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [asunto, setAsunto] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ExpedienteInput, string>>>({})
  const [errorMsg, setErrorMsg] = useState('')

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMode('upload')
      setParseStatus('idle')
      setNumeroExpediente('')
      setAsunto('')
      setFiles([])
      setStatus('idle')
      setFieldErrors({})
      setErrorMsg('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && status !== 'submitting') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, status, onClose])

  // Focus the first input when the fields become visible (after parse or switching to manual)
  useEffect(() => {
    if (parseStatus === 'parsed' || parseStatus === 'parse-error' || mode === 'manual') {
      setTimeout(() => firstInputRef.current?.focus(), 0)
    }
  }, [parseStatus, mode])

  if (!isOpen) return null

  const isSubmitting = status === 'submitting'
  const canSubmit = numeroExpediente.trim() && asunto.trim() && !isSubmitting

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFiles([file])
    setParseStatus('parsing')
    setNumeroExpediente('')
    setAsunto('')

    try {
      const text = await extractTextFromPdf(file)
      const extracted = parseExpedienteFromText(text)
      setNumeroExpediente(extracted.numeroExpediente ?? '')
      setAsunto(extracted.asunto ?? '')
      setParseStatus('parsed')
    } catch {
      setParseStatus('parse-error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const input = { numeroExpediente, asunto }
    const { valid, errors } = validateExpediente(input, existingIds)
    if (!valid) {
      setFieldErrors(errors)
      setStatus('error')
      return
    }

    setFieldErrors({})
    setErrorMsg('')
    setStatus('submitting')

    try {
      await onSubmit(input, files)
    } catch (err) {
      setErrorMsg((err as Error).message || 'Error al crear el expediente')
      setStatus('error')
    }
  }

  function handleManualFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles([...e.target.files!])
  }

  function switchToManual() {
    setMode('manual')
    setParseStatus('idle')
  }

  function switchToUpload() {
    setMode('upload')
    setParseStatus('idle')
    setFiles([])
    setNumeroExpediente('')
    setAsunto('')
    setFieldErrors({})
    setErrorMsg('')
  }

  // ── Shared fields section (shown after PDF parse or in manual mode) ──

  const showFields = mode === 'manual' || parseStatus === 'parsed' || parseStatus === 'parse-error'

  const fieldSection = (
    <>
      {parseStatus === 'parsed' && (
        <p className="pdf-extract-note">
          Datos extraídos del PDF, revísalos antes de crear.
        </p>
      )}
      {parseStatus === 'parse-error' && (
        <p className="pdf-extract-error">
          No se pudieron leer los datos del PDF. Introdúcelos manualmente.
        </p>
      )}

      <label className="login-label" htmlFor="modal-numero">
        Número de expediente *
      </label>
      <input
        id="modal-numero"
        ref={firstInputRef}
        className="login-input"
        type="text"
        placeholder="Ej: EXP-2026-001"
        value={numeroExpediente}
        onChange={e => setNumeroExpediente(e.target.value)}
        disabled={isSubmitting}
        aria-describedby={fieldErrors.numeroExpediente ? 'error-numero' : undefined}
      />
      {fieldErrors.numeroExpediente && (
        <span id="error-numero" className="login-error">{fieldErrors.numeroExpediente}</span>
      )}

      <label className="login-label" htmlFor="modal-asunto">
        Asunto *
      </label>
      <input
        id="modal-asunto"
        className="login-input"
        type="text"
        placeholder="Describe brevemente la solicitud"
        value={asunto}
        onChange={e => setAsunto(e.target.value)}
        disabled={isSubmitting}
        aria-describedby={fieldErrors.asunto ? 'error-asunto' : undefined}
      />
      {fieldErrors.asunto && (
        <span id="error-asunto" className="login-error">{fieldErrors.asunto}</span>
      )}
    </>
  )

  // ── Upload mode ──────────────────────────────────────────────────────

  const uploadView = (
    <>
      {parseStatus === 'idle' && (
        <label className="pdf-dropzone" aria-label="Subir PDF del expediente">
          <svg className="pdf-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span className="pdf-dropzone-title">Sube el PDF del expediente</span>
          <span className="pdf-dropzone-hint">Justificante de registro (.pdf)</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handlePdfSelect}
            disabled={isSubmitting}
          />
        </label>
      )}

      {parseStatus === 'parsing' && (
        <div className="pdf-parsing-status">
          <span className="pdf-spinner" aria-hidden="true" />
          Leyendo PDF…
        </div>
      )}

      {showFields && (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {fieldSection}

          {errorMsg && (
            <span className="login-error">{errorMsg}</span>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Creando…' : 'Crear expediente'}
          </button>
        </form>
      )}

      {parseStatus === 'idle' && (
        <div className="modal-mode-switch">
          <button type="button" className="modal-mode-link" onClick={switchToManual}>
            Introducir datos manualmente
          </button>
        </div>
      )}
    </>
  )

  // ── Manual mode ──────────────────────────────────────────────────────

  const plural = files.length > 1 ? 's' : ''
  const fileLabel = files.length === 0
    ? 'Seleccionar archivos…'
    : `${files.length} archivo${plural} seleccionado${plural}`

  const manualView = (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {fieldSection}

      <label className="login-label" htmlFor="modal-archivos">
        Archivos adjuntos
      </label>
      <label className="upload-btn modal-file-label" style={{ cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
        {fileLabel}
        <input
          id="modal-archivos"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleManualFileChange}
          disabled={isSubmitting}
        />
      </label>
      {files.length > 0 && (
        <ul className="modal-files">
          {files.map((f, i) => (
            <li key={i} className="modal-file-item">{f.name}</li>
          ))}
        </ul>
      )}

      {errorMsg && (
        <span className="login-error">{errorMsg}</span>
      )}

      <button
        type="submit"
        className="login-btn"
        disabled={!canSubmit}
      >
        {isSubmitting ? 'Creando…' : 'Crear expediente'}
      </button>

      <div className="modal-mode-switch">
        <button type="button" className="modal-mode-link" onClick={switchToUpload}>
          ← Volver a subir PDF
        </button>
      </div>
    </form>
  )

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-card login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">Nuevo expediente</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {mode === 'upload' ? uploadView : manualView}
      </div>
    </div>
  )
}
