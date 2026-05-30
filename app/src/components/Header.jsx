import { TODAY } from '../utils/dates.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Header({ onCSVLoad }) {
  const { session, signOut } = useAuth()
  const todayStr = TODAY.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onCSVLoad(ev.target.result, file.name)
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  return (
    <header>
      <div>
        <h1>Civio · Tracker de Solicitudes de Transparencia</h1>
        <div className="subtitle">Derecho de acceso a la información pública — OPP-2</div>
      </div>
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
