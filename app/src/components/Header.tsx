import type { ChangeEvent } from 'react'
import { TODAY } from '../utils/dates.js'
import { useAuth } from '../contexts/AuthContext.jsx'

interface HeaderProps {
  onCSVLoad: (csvText: string, sourceName: string) => void
  onNewExpediente: () => void
}

export default function Header({ onCSVLoad, onNewExpediente }: HeaderProps) {
  const { session, signOut } = useAuth()
  const todayStr = TODAY.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onCSVLoad(ev.target?.result as string, file.name)
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  return (
    <header>
      <div>
        <h1>Civio · Tracker de Solicitudes de Transparencia</h1>
        <div className="subtitle">Derecho de acceso a la información pública — OPP-2</div>
      </div>
      <button
        type="button"
        className="new-expediente-btn"
        onClick={onNewExpediente}
        title="Dar de alta un nuevo expediente"
      >
        Nuevo expediente
      </button>
      <label className="upload-btn" title="Cargar tu propio CSV de solicitudes">
        Cargar CSV
        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
      </label>
      <div className="today-badge">{todayStr}</div>
      {session && (
        <button className="logout-btn" onClick={signOut} title="Cerrar sesión">
          Salir
        </button>
      )}
    </header>
  )
}
