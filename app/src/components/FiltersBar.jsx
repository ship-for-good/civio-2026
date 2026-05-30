import { useMemo } from 'react'

const EMPTY_FILTERS = { search: '', estado: '', autor: '', ambito: '', urgencia: '' }

export default function FiltersBar({ requests, filters, onFilterChange, filteredCount, totalCount }) {
  const estados = useMemo(() =>
    [...new Set(requests.map(r => r['Estado']).filter(Boolean))].sort(),
    [requests]
  )
  const autores = useMemo(() =>
    [...new Set(requests.map(r => r['Autor']).filter(Boolean))].sort(),
    [requests]
  )
  const ambitos = useMemo(() =>
    [...new Set(requests.map(r => r['Ámbito']).filter(Boolean))].sort(),
    [requests]
  )

  function update(key, value) {
    onFilterChange(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="filters-bar">
      <input
        type="search"
        placeholder="Buscar por asunto, ministerio, ID..."
        value={filters.search}
        onChange={e => update('search', e.target.value)}
      />
      <select value={filters.estado} onChange={e => update('estado', e.target.value)}>
        <option value="">Todos los estados</option>
        {estados.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={filters.autor} onChange={e => update('autor', e.target.value)}>
        <option value="">Todos los autores</option>
        {autores.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={filters.ambito} onChange={e => update('ambito', e.target.value)}>
        <option value="">Todos los ámbitos</option>
        {ambitos.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={filters.urgencia} onChange={e => update('urgencia', e.target.value)}>
        <option value="">Toda urgencia</option>
        <option value="critical">🔴 Crítico</option>
        <option value="warning">🟠 Urgente</option>
        <option value="ok">🟢 Normal</option>
        <option value="neutral">⚪ Sin plazo activo</option>
      </select>
      <button onClick={() => onFilterChange(EMPTY_FILTERS)}>Limpiar</button>
      <span className="count-label">{filteredCount} de {totalCount} solicitudes</span>
    </div>
  )
}
