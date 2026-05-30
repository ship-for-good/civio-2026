import { useEffect, useRef } from 'react'
import { formatDateShort } from '../utils/dates.js'

const STATE_BADGE_CLASS = {
  'En tramitación': 'badge-tramitacion',
  'Reclamada': 'badge-reclamada',
  'Contencioso': 'badge-contencioso',
  'Resuelta': 'badge-resuelta',
}

const URGENCY_ICON = { critical: '🔴', warning: '🟠', ok: '🟢' }

const COLUMNS = [
  { key: 'urgencyOrder', label: 'URG', title: 'Urgencia' },
  { key: 'Id', label: 'Expediente', title: 'ID Expediente' },
  { key: 'Asunto', label: 'Asunto' },
  { key: 'Estado', label: 'Estado' },
  { key: 'Autor', label: 'Autor' },
  { key: 'Ámbito', label: 'Ámbito' },
  { key: 'Vencimiento', label: 'Vencimiento', title: 'Fecha de vencimiento' },
  { key: 'daysUntilDeadline', label: 'Días', title: 'Días hasta el vencimiento' },
  { key: 'Fecha', label: 'Solicitado' },
  { key: null, label: 'Reclamación' },
  { key: null, label: 'Notas' },
]

export default function RequestsTable({ requests, sort, onSort, highlightedId }) {
  const rowRefs = useRef({})

  useEffect(() => {
    if (highlightedId && rowRefs.current[highlightedId]) {
      rowRefs.current[highlightedId].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId])

  return (
    <div className="table-scroll table-wrapper">
      <table>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.label}
                title={col.title}
                className={
                  col.key && sort.column === col.key
                    ? sort.dir === 'asc' ? 'sorted-asc' : 'sorted-desc'
                    : ''
                }
                onClick={col.key ? () => onSort(col.key) : undefined}
                style={!col.key ? { cursor: 'default' } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <TableRow
              key={r['Id']}
              r={r}
              isHighlighted={r['Id'] === highlightedId}
              setRef={el => { if (el) rowRefs.current[r['Id']] = el }}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableRow({ r, isHighlighted, setRef }) {
  const daysVal = r.daysUntilDeadline
  let daysText = '—'
  let daysStyle = {}

  if (daysVal !== null) {
    if (daysVal < 0) {
      daysText = `Venc. hace ${Math.abs(daysVal)}d`
      daysStyle = { color: 'var(--civio-red)', fontWeight: 600 }
    } else if (daysVal === 0) {
      daysText = '¡Hoy!'
      daysStyle = { color: 'var(--civio-red)', fontWeight: 700 }
    } else {
      daysText = `${daysVal}d`
      if (daysVal <= 7) daysStyle = { color: 'var(--civio-red)', fontWeight: 600 }
      else if (daysVal <= 15) daysStyle = { color: 'var(--civio-orange)', fontWeight: 500 }
    }
  }

  const badgeClass = STATE_BADGE_CLASS[r['Estado']] || 'badge-other'
  const icon = URGENCY_ICON[r.urgencyLevel] || '⚪'
  const notas = r['Notas'] || ''

  return (
    <tr
      ref={setRef}
      className={`urgency-${r.urgencyLevel}${isHighlighted ? ' highlighted' : ''}`}
    >
      <td>
        <span className={`urgency-label ${r.urgencyLevel}`}>
          {icon} {r.urgencyLabel}
        </span>
      </td>
      <td className="id-cell" title={r['Id']}>{r['Id']}</td>
      <td className="asunto-cell">
        <div className="asunto-text">{r['Asunto'] || '—'}</div>
        {r['Ministerio'] && <div className="ministerio-text">{r['Ministerio']}</div>}
      </td>
      <td><span className={`badge ${badgeClass}`}>{r['Estado']}</span></td>
      <td>{r['Autor'] || '—'}</td>
      <td>{r['Ámbito'] || '—'}</td>
      <td className="deadline-cell">
        <div className="deadline-date">{formatDateShort(r['Vencimiento'])}</div>
      </td>
      <td style={daysStyle}>{daysText}</td>
      <td>{formatDateShort(r['Fecha'])}</td>
      <td style={{ fontSize: '11px', color: '#888' }}>{r['Reclamación'] || '—'}</td>
      <td className="notas-cell" title={notas}>
        {notas.length > 60 ? notas.substring(0, 60) + '…' : notas}
      </td>
    </tr>
  )
}
