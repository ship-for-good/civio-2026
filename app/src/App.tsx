import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { parseCSV } from './utils/csv.js'
import { enrichRequests, type EnrichedRequest, type RawRequest } from './utils/urgency.js'
import { CSV_RAW } from './data/csvData.js'
import { TODAY, toISODate } from './utils/dates.js'
import { buildExpediente, expedienteRecordToRaw, mergeById, applyEdit, type ExpedienteInput, type ExpedienteEditInput } from './utils/expediente.js'
import { uploadAttachments, insertExpediente, updateExpediente, fetchExpedientes } from './lib/expedientesRepo.js'
import { useAuth } from './contexts/AuthContext.jsx'
import Header from './components/Header.jsx'
import StatsBar from './components/StatsBar.jsx'
import DigestSection from './components/DigestSection.jsx'
import FiltersBar, { type Filters } from './components/FiltersBar.jsx'
import RequestsTable from './components/RequestsTable.jsx'
import Toast from './components/Toast.jsx'
import NewExpedienteModal from './components/NewExpedienteModal.jsx'
import EditExpedienteModal from './components/EditExpedienteModal.jsx'

const EMPTY_FILTERS: Filters = { search: '', estado: '', autor: '', ambito: '', urgencia: '' }

function loadAndEnrich(csvText: string): EnrichedRequest[] {
  return enrichRequests(parseCSV(csvText) as unknown as RawRequest[])
}

interface Sort {
  column: string
  dir: 'asc' | 'desc'
}

export default function App() {
  const { session } = useAuth()
  const [requests, setRequests] = useState<EnrichedRequest[]>(() => loadAndEnrich(CSV_RAW))
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<Sort>({ column: 'urgencyOrder', dir: 'asc' })
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<EnrichedRequest | null>(null)
  const dragCounter = useRef(0)

  const existingIds = useMemo(() => requests.map(r => r['Id']), [requests])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }, [])

  useEffect(() => {
    fetchExpedientes()
      .then(records => {
        const fetched = enrichRequests(records.map(expedienteRecordToRaw))
        setRequests(prev => mergeById(prev, fetched))
      })
      .catch(() => showToast('Error al cargar expedientes de la base de datos'))
  }, [showToast])

  const handleCSVLoad = useCallback((csvText: string, sourceName: string) => {
    const loaded = loadAndEnrich(csvText)
    setRequests(loaded)
    setFilters(EMPTY_FILTERS)
    showToast(`CSV cargado: ${sourceName} (${loaded.length} solicitudes)`)
  }, [showToast])

  const handleHighlight = useCallback((id: string) => {
    setHighlightedId(id)
    setTimeout(() => setHighlightedId(null), 2000)
  }, [])

  const handleSort = useCallback((col: string) => {
    setSort(prev => ({
      column: col,
      dir: prev.column === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = ev => handleCSVLoad(ev.target?.result as string, file.name)
      reader.readAsText(file, 'UTF-8')
    } else {
      showToast('Solo se aceptan archivos .csv')
    }
  }, [handleCSVLoad, showToast])

  const handleEdit = useCallback((r: EnrichedRequest) => setEditing(r), [])

  const handleUpdateExpediente = useCallback(async (
    id: string,
    input: ExpedienteEditInput,
    newFiles: File[],
  ) => {
    const current = requests.find(r => r['Id'] === id)!
    const newPaths = newFiles.length ? await uploadAttachments(newFiles, id) : []
    const mergedAttachments = [...(current.attachments ?? []), ...newPaths]
    await updateExpediente(id, {
      asunto: input.asunto,
      estado: input.estado,
      vencimiento: input.vencimiento || null,
      notas: input.notas,
      attachments: mergedAttachments,
    })
    const updatedRaw = applyEdit(current, input)
    const [enriched] = enrichRequests([{ ...updatedRaw, attachments: mergedAttachments }])
    setRequests(prev => prev.map(r => r['Id'] === id ? enriched : r))
    setEditing(null)
    showToast(`Expediente ${id} actualizado ✓`)
  }, [requests, showToast])

  const handleCreateExpediente = useCallback(async (input: ExpedienteInput, files: File[]) => {
    const raw = buildExpediente(input, toISODate(TODAY), { autor: session?.user?.email })
    const attachments = files.length
      ? await uploadAttachments(files, raw['Id'])
      : []
    await insertExpediente({
      id: raw['Id'],
      asunto: raw['Asunto'],
      estado: raw['Estado'],
      fecha: raw['Fecha'],
      vencimiento: null,
      autor: raw['Autor'],
      attachments,
    })
    const [enriched] = enrichRequests([raw])
    setRequests(prev => [enriched, ...prev])
    setIsModalOpen(false)
    showToast(`Expediente ${raw['Id']} creado ✓`)
  }, [session, showToast])

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
    let va: string | number = (a as unknown as Record<string, unknown>)[sort.column] as string ?? ''
    let vb: string | number = (b as unknown as Record<string, unknown>)[sort.column] as string ?? ''
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

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header onCSVLoad={handleCSVLoad} onNewExpediente={() => setIsModalOpen(true)} />
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
            onEdit={handleEdit}
          />
        </div>
      </div>
      <Toast message={toastMsg} />
      <NewExpedienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpediente}
        existingIds={existingIds}
      />
      <EditExpedienteModal
        isOpen={!!editing}
        request={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdateExpediente}
      />
    </div>
  )
}
