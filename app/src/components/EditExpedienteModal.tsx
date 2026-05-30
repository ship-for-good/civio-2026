import { useEffect, useRef, useState } from 'react'
import { validateExpedienteEdit, ESTADOS, type ExpedienteEditInput } from '../utils/expediente.js'
import type { EnrichedRequest } from '../utils/urgency.js'

interface EditExpedienteModalProps {
  isOpen: boolean
  request: EnrichedRequest | null
  onClose: () => void
  onSubmit: (id: string, input: ExpedienteEditInput, newFiles: File[]) => Promise<void>
}

type Status = 'idle' | 'submitting' | 'error'

export default function EditExpedienteModal({
  isOpen,
  request,
  onClose,
  onSubmit,
}: EditExpedienteModalProps) {
  const [asunto, setAsunto] = useState('')
  const [estado, setEstado] = useState<string>(ESTADOS[0])
  const [vencimiento, setVencimiento] = useState('')
  const [notas, setNotas] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [errorMsg, setErrorMsg] = useState('')

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && request) {
      setAsunto(request['Asunto'] ?? '')
      setEstado((request['Estado'] as typeof ESTADOS[number]) ?? ESTADOS[0])
      setVencimiento(request['Vencimiento'] ?? '')
      setNotas(request['Notas'] ?? '')
      setFiles([])
      setStatus('idle')
      setFieldErrors({})
      setErrorMsg('')
      setTimeout(() => firstInputRef.current?.focus(), 0)
    }
  }, [isOpen, request])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && status !== 'submitting') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, status, onClose])

  if (!isOpen || !request) return null

  const isSubmitting = status === 'submitting'
  const canSubmit = asunto.trim() && !isSubmitting
  const existingAttachments = request.attachments ?? []
  const plural = files.length > 1 ? 's' : ''
  const fileLabel = files.length === 0
    ? 'Añadir archivos…'
    : `${files.length} archivo${plural} seleccionado${plural}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const input: ExpedienteEditInput = { asunto, estado, vencimiento, notas }
    const { valid, errors } = validateExpedienteEdit(input)
    if (!valid) {
      setFieldErrors(errors)
      setStatus('error')
      return
    }

    setFieldErrors({})
    setErrorMsg('')
    setStatus('submitting')

    try {
      await onSubmit(request!['Id'], input, files)
    } catch (err) {
      setErrorMsg((err as Error).message || 'Error al guardar el expediente')
      setStatus('error')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles([...e.target.files!])
  }

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
        aria-labelledby="edit-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="edit-modal-title" className="modal-title">
            Editar expediente <span style={{ fontWeight: 400, opacity: 0.7 }}>{request['Id']}</span>
          </h2>
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

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-label" htmlFor="edit-asunto">
            Asunto *
          </label>
          <input
            id="edit-asunto"
            ref={firstInputRef}
            className="login-input"
            type="text"
            value={asunto}
            onChange={e => setAsunto(e.target.value)}
            disabled={isSubmitting}
            aria-describedby={fieldErrors.asunto ? 'edit-error-asunto' : undefined}
          />
          {fieldErrors.asunto && (
            <span id="edit-error-asunto" className="login-error">{fieldErrors.asunto}</span>
          )}

          <label className="login-label" htmlFor="edit-estado">
            Estado *
          </label>
          <select
            id="edit-estado"
            className="login-input"
            value={estado}
            onChange={e => setEstado(e.target.value)}
            disabled={isSubmitting}
            aria-describedby={fieldErrors.estado ? 'edit-error-estado' : undefined}
          >
            {ESTADOS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {fieldErrors.estado && (
            <span id="edit-error-estado" className="login-error">{fieldErrors.estado}</span>
          )}

          <label className="login-label" htmlFor="edit-vencimiento">
            Vencimiento
          </label>
          <input
            id="edit-vencimiento"
            className="login-input"
            type="date"
            value={vencimiento}
            onChange={e => setVencimiento(e.target.value)}
            disabled={isSubmitting}
          />

          <label className="login-label" htmlFor="edit-notas">
            Notas
          </label>
          <textarea
            id="edit-notas"
            className="login-input"
            rows={3}
            value={notas}
            onChange={e => setNotas(e.target.value)}
            disabled={isSubmitting}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '14px' }}
          />

          <label className="login-label" htmlFor="edit-archivos">
            Añadir adjuntos
            {existingAttachments.length > 0 && (
              <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 8 }}>
                ({existingAttachments.length} existente{existingAttachments.length > 1 ? 's' : ''})
              </span>
            )}
          </label>
          <label className="upload-btn modal-file-label" style={{ cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
            {fileLabel}
            <input
              id="edit-archivos"
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
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
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
