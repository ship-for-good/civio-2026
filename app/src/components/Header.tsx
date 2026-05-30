import { useState, useRef, useEffect } from 'react'
import { TODAY } from '../utils/dates.js'
import { useAuth } from '../contexts/AuthContext.jsx'

interface HeaderProps {
  onNewExpediente: () => void
}

export default function Header({ onNewExpediente }: HeaderProps) {
  const { session, displayName, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const todayStr = TODAY.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <header>
      <h1 className="civio-logo">
        CivioDoc
        <span className="civio-dots" aria-hidden="true">
          <span className="civio-dot civio-dot--green" />
          <span className="civio-dot civio-dot--yellow" />
        </span>
      </h1>
      <button
        type="button"
        className="new-expediente-btn"
        onClick={onNewExpediente}
        title="Dar de alta un nuevo expediente"
      >
        Nuevo expediente
      </button>
      <div className="today-badge">{todayStr}</div>
      {session && (
        <div className="user-menu" ref={menuRef}>
          <button
            className="user-avatar-btn"
            onClick={() => setMenuOpen(o => !o)}
            title={displayName}
            aria-expanded={menuOpen}
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-info">
                <span className="user-dropdown-name">{displayName}</span>
                <span className="user-dropdown-email">{session.user.email}</span>
              </div>
              <hr className="user-dropdown-divider" />
              <button className="user-dropdown-signout" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
