import { TODAY } from '../utils/dates.js'
import { useAuth } from '../contexts/AuthContext.jsx'

interface HeaderProps {
  onNewExpediente: () => void
}

export default function Header({ onNewExpediente }: HeaderProps) {
  const { session, signOut } = useAuth()
  const todayStr = TODAY.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header>
      <h1>CivioDoc</h1>
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
        <button className="logout-btn" onClick={signOut} title="Cerrar sesión">
          Salir
        </button>
      )}
    </header>
  )
}
