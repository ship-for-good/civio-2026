import { useState, useCallback, useRef } from 'react'
import { parseCSV } from './utils/csv.js'
import { enrichRequests } from './utils/urgency.js'
import { CSV_RAW } from './data/csvData.js'
import { useAuth } from './contexts/AuthContext.jsx'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import DigestSection from './components/DigestSection.jsx'
import FiltersBar from './components/FiltersBar.jsx'
import RequestsTable from './components/RequestsTable.jsx'
import Toast from './components/Toast.jsx'
import LoginPage from './components/LoginPage.jsx'

const EMPTY_FILTERS = { search: '', estado: '', autor: '', ambito: '', urgencia: '' }

function loadAndEnrich(csvText) {
  return enrichRequests(parseCSV(csvText))
}

export default function App() {
  const { session } = useAuth()
  const [requests, setRequests] = useState(() => loadAndEnrich(CSV_RAW))
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState({ column: 'urgencyOrder', dir: 'asc' })
  const [toastMsg, setToastMsg] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }, [])

  const handleCSVLoad = useCallback((csvText, sourceName) => {
    const loaded = loadAndEnrich(csvText)
    setRequests(loaded)
    setFilters(EMPTY_FILTERS)
    showToast(`CSV cargado: ${sourceName} (${loaded.length} solicitudes)`)
  }, [showToast])

  const handleHighlight = useCallback((id) => {
    setHighlightedId(id)
    setTimeout(() => setHighlightedId(null), 2000)
  }, [])

  const handleSort = useCallback((col) => {
    setSort(prev => ({
      column: col,
      dir: prev.column === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const handleDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = ev => handleCSVLoad(ev.target.result, file.name)
      reader.readAsText(file, 'UTF-8')
    } else {
      showToast('Solo se aceptan archivos .csv')
    }
  }, [handleCSVLoad, showToast])

  const filtered = requests.filter(r => {
    if (filters.estado && r['Estado'] !== filters.estado) return false
    if (filters.autor && r['Autor'] !== filters.autor) return false
    if (filters.ambito && r['Ámbito'] !== filters.ambito) return false
    if (filters.urgencia && r.urgencyLevel !== filters.urgencia) return false
    if (filters.search) {
      const hay = [r['Id'], r['Asunto'], r['Ministerio'], r['Autor'], r['Ámbito']]
        .join(' ').toLowerCase()
      if (!hay.includes(filters.search.toLowerCase())) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sort.column] ?? ''
    let vb = b[sort.column] ?? ''
    if (sort.column === 'urgencyOrder' || sort.column === 'daysUntilDeadline') {
      va = va === '' || va === null || va === undefined ? 9999 : Number(va)
      vb = vb === '' || vb === null || vb === undefined ? 9999 : Number(vb)
    } else {
      va = String(va).toLowerCase()
      vb = String(vb).toLowerCase()
    }
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  if (session === undefined) return null
  if (!session) return <LoginPage />

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header onCSVLoad={handleCSVLoad} />
      {isDragOver && (
        <div className="drop-banner">Suelta el CSV aquí</div>
      )}
      <div className="container">
        <StatsBar requests={requests} />
        <DigestSection
          requests={requests}
          onHighlight={handleHighlight}
          showToast={showToast}
        />
        <div>
          <div className="section-header">
            <div className="section-title">📋 Todas las Solicitudes</div>
          </div>
          <FiltersBar
            requests={requests}
            filters={filters}
            onFilterChange={setFilters}
            filteredCount={sorted.length}
            totalCount={requests.length}
          />
          <RequestsTable
            requests={sorted}
            sort={sort}
            onSort={handleSort}
            highlightedId={highlightedId}
          />
        </div>
      </div>
      <Toast message={toastMsg} />
    </div>
  )
}
