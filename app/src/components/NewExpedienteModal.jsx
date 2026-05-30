import { useEffect, useRef, useState } from 'react'
import { validateExpediente } from '../utils/expediente.js'

export default function NewExpedienteModal({ isOpen, onClose, onSubmit, existingIds }) {
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [asunto, setAsunto] = useState('')
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'error'
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMsg, setErrorMsg] = useState('')

  const firstInputRef = useRef(null)

  // Foco al primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNumeroExpediente('')
      setAsunto('')
      setFiles([])
      setStatus('idle')
      setFieldErrors({})
      setErrorMsg('')
      setTimeout(() => firstInputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Cerrar con Esc (excepto mientras se envía)
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape' && status !== 'submitting') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, status, onClose])

  if (!isOpen) return null

  const isSubmitting = status === 'submitting'
  const canSubmit = numeroExpediente.trim() && asunto.trim() && !isSubmitting
  const plural = files.length > 1 ? 's' : ''
  const fileLabel = files.length === 0
    ? 'Seleccionar archivos…'
    : `${files.length} archivo${plural} seleccionado${plural}`

  async function handleSubmit(e) {
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
      // El padre cierra el modal en caso de éxito.
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear el expediente')
      setStatus('error')
    }
  }

  function handleFileChange(e) {
    setFiles([...e.target.files])
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

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
            {isSubmitting ? 'Creando…' : 'Crear expediente'}
          </button>
        </form>
      </div>
    </div>
  )
}
