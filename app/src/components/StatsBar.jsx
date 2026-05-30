export default function StatsBar({ requests }) {
  const critical = requests.filter(r => r.urgencyLevel === 'critical').length
  const warning = requests.filter(r => r.urgencyLevel === 'warning').length
  const enTramitacion = requests.filter(r => r['Estado'] === 'En tramitación').length
  const reclamadas = requests.filter(r => r['Estado'] === 'Reclamada').length
  const contenciosas = requests.filter(r => r['Estado'] === 'Contencioso').length

  return (
    <div className="stats-bar">
      <StatCard value={critical} label="Crítico / Acción hoy" variant="critical" />
      <StatCard value={warning} label="Urgente (<30 días)" variant="warning" />
      <StatCard value={enTramitacion} label="En tramitación" />
      <StatCard value={reclamadas} label="Reclamadas (CTBG)" />
      <StatCard value={contenciosas} label="Contencioso-adm." />
      <StatCard value={requests.length} label="Total solicitudes" />
    </div>
  )
}

function StatCard({ value, label, variant = 'total' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}
