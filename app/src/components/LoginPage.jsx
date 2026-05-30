import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { signInWithPassword, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | signup
  const [status, setStatus] = useState('idle') // idle | loading | error | confirm
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    if (mode === 'login') {
      const { error } = await signInWithPassword(email, password)
      if (error) {
        const isInvalidCreds = error.message?.toLowerCase().includes('invalid login')
        setErrorMsg(
          isInvalidCreds
            ? 'Email o contraseña incorrectos.'
            : error.message
        )
        setStatus('error')
      }
      // On success, onAuthStateChange updates the session and App.jsx re-renders
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
      } else {
        setStatus('confirm')
      }
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setStatus('idle')
    setErrorMsg('')
  }

  const buttonLabel = status === 'loading' ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⚖️</span>
          <h1 className="login-title">Civio · Transparencia</h1>
          <p className="login-subtitle">Acceso restringido al equipo de Civio</p>
        </div>

        {status === 'confirm' ? (
          <div className="login-sent">
            <span className="login-sent-icon">📬</span>
            <p className="login-sent-title">¡Cuenta creada!</p>
            <p className="login-sent-body">
              Revisa tu correo en <strong>{email}</strong> y confirma la cuenta para acceder.
            </p>
          </div>
        ) : (
          <>
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
              <label htmlFor="password" className="login-label">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status === 'loading'}
                className="login-input"
              />
              {status === 'error' && (
                <p className="login-error">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading' || !email || !password}
                className="login-btn"
              >
                {buttonLabel}
              </button>
            </form>

            <p className="login-toggle">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button type="button" onClick={switchMode} className="login-toggle-link">
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
