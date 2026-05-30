import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const { error } = await signIn(email)
    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⚖️</span>
          <h1 className="login-title">Civio · Transparencia</h1>
          <p className="login-subtitle">Acceso restringido al equipo de Civio</p>
        </div>

        {status === 'sent' ? (
          <div className="login-sent">
            <span className="login-sent-icon">📬</span>
            <p className="login-sent-title">¡Enlace enviado!</p>
            <p className="login-sent-body">
              Revisa tu bandeja de entrada en <strong>{email}</strong> y haz clic en el enlace para acceder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email" className="login-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              required
              placeholder="tu@civio.es"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              className="login-input"
            />
            {status === 'error' && (
              <p className="login-error">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="login-btn"
            >
              {status === 'loading' ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
