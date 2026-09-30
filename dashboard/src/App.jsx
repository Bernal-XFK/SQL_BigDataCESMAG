import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Code2,
  Copy,
  Database,
  FileCode2,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { useExecutions } from './api.js'

const FILTERS = [
  { key: 'all', label: 'Todas las entregas' },
  { key: 'success', label: 'Exitosas' },
  { key: 'error', label: 'Con errores' },
]

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-900',
  'bg-rose-100 text-rose-800',
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
]

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function avatarColor(name = '') {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function parseTimestamp(value) {
  if (!value) return null
  const display = String(value).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
  if (display) {
    let hour = Number(display[4]) % 12
    if (display[6].toUpperCase() === 'PM') hour += 12
    return new Date(Number(display[1]), Number(display[2]) - 1, Number(display[3]), hour, Number(display[5]))
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function relativeTime(value, reference = Date.now()) {
  const date = parseTimestamp(value)
  if (!date) return value || 'Fecha no disponible'
  const seconds = Math.max(0, Math.floor((reference - date.getTime()) / 1000))
  if (seconds < 60) return 'Hace un momento'
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return null
  const value = Number(bytes)
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`
  return `${(value / 1024 ** 3).toFixed(2)} GB`
}

function StatusBadge({ status, compact = false }) {
  const success = status === 'success'
  const Icon = success ? CheckCircle2 : XCircle
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {compact ? (success ? 'Exitosa' : 'Fallida') : success ? 'Ejecución exitosa' : 'Requiere revisión'}
    </span>
  )
}

function MetricCard({ label, value, detail, icon: Icon, tone, onClick, active }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </>
  )

  const className = `w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 ${
    onClick ? 'hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2' : ''
  } ${active ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'}`

  return onClick ? (
    <button type="button" className={className} onClick={onClick} aria-pressed={active}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

function LoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-busy="true" aria-label="Cargando entregas">
      <div className="hidden grid-cols-[1.2fr_1.5fr_1.4fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 md:grid">
        {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-3 animate-pulse rounded bg-slate-200" />)}
      </div>
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-52 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden h-6 w-24 animate-pulse rounded-full bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ searched, search, onClear }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
        {searched ? <Search className="h-6 w-6" aria-hidden="true" /> : <FolderKanban className="h-6 w-6" aria-hidden="true" />}
      </span>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">
        {searched ? 'No encontramos coincidencias' : 'El laboratorio está listo'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {searched
          ? search ? `No hay entregas que coincidan con “${search}” y los filtros actuales.` : 'No hay entregas con el estado seleccionado.'
          : 'Aún no aparecen entregas. Cuando se envíe una consulta SQL, su validación se mostrará aquí.'}
      </p>
      {searched && (
        <button type="button" onClick={onClear} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
          Limpiar búsqueda y filtros <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

function tokenizeSql(sql) {
  const pattern = /(\-\-[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:\\.|[^"])*"|`[^`]*`|\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IS|IN|LIKE|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|CREATE|TABLE|INSERT|UPDATE|DELETE|WITH|OVER|PARTITION|DESC|ASC|TRUE|FALSE)\b|\b\d+(?:\.\d+)?\b)/gi
  const pieces = String(sql || '').split(pattern)
  return pieces.map((piece, index) => {
    let type = 'plain'
    if (/^(--|\/\*)/.test(piece)) type = 'comment'
    else if (/^['"`]/.test(piece)) type = 'string'
    else if (/^\d/.test(piece)) type = 'number'
    else if (/^(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IS|IN|LIKE|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|CREATE|TABLE|INSERT|UPDATE|DELETE|WITH|OVER|PARTITION|DESC|ASC|TRUE|FALSE)$/i.test(piece)) type = 'keyword'
    return <span key={`${index}-${piece}`} className={{ comment: 'text-slate-500 italic', string: 'text-amber-300', number: 'text-cyan-300', keyword: 'text-teal-300 font-semibold' }[type]}>{piece}</span>
  })
}

function SqlCode({ sql }) {
  if (!sql) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        El SQL original no está almacenado para esta entrega. Las nuevas ejecuciones lo guardarán automáticamente.
      </div>
    )
  }
  return (
    <pre className="max-h-[52vh] overflow-auto rounded-xl border border-slate-800 bg-[#101a23] p-5 text-[13px] leading-6 text-slate-100 shadow-inner">
      <code className="font-mono">{tokenizeSql(sql)}</code>
    </pre>
  )
}

function ResultTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
        <Database className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-700">La consulta no devolvió filas</p>
        <p className="mt-1 text-xs text-slate-500">La ejecución pudo completarse correctamente; el resultado está vacío.</p>
      </div>
    )
  }
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row || {})))]
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Filas de muestra</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{rows.length} filas</span>
      </div>
      <div className="max-h-[48vh] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>{columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-teal-50/40">
                {columns.map((column) => <td key={column} className="max-w-xs whitespace-nowrap px-4 py-3 text-slate-700">{row?.[column] === null || row?.[column] === undefined ? <span className="text-slate-400">NULL</span> : String(row[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function friendlyError(execution) {
  if (execution.errorType === 'IAM_PERMISSIONS') return 'La cuenta de ejecución no tiene permiso para consultar este conjunto de datos. Contacta al docente.'
  if (execution.errorType === 'SINTAXIS_SQL') return 'BigQuery no pudo interpretar la consulta. Revisa la sintaxis SQL, los nombres de columnas y el uso de comillas.'
  if (execution.errorType === 'TABLA_NO_EXISTE') return 'No se encontró la tabla o el conjunto de datos. Comprueba su nombre.'
  if (execution.errorMessage) return execution.errorMessage
  return 'La consulta no se pudo completar. Revisa el SQL y vuelve a intentarlo.'
}

function SqlModal({ execution, onClose }) {
  const [tab, setTab] = useState('code')
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previousFocus = useRef(null)

  useEffect(() => {
    if (!execution) return undefined
    previousFocus.current = document.activeElement
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    closeButtonRef.current?.focus()
    return () => {
      if (dialog?.open) dialog.close()
      previousFocus.current?.focus?.()
      setCopied(false)
      setTab('code')
    }
  }, [execution])

  if (!execution) return null
  const success = execution.queryStatus === 'success'

  const copySql = async () => {
    if (!execution.sqlText) return
    try {
      await navigator.clipboard.writeText(execution.sqlText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="sql-modal-title" onCancel={(event) => { event.preventDefault(); onClose() }} className="animate-modal-in m-auto max-h-[94dvh] w-[calc(100%-1rem)] max-w-4xl flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white p-0 text-slate-900 shadow-2xl sm:max-h-[88vh] sm:w-[calc(100%-3rem)]">
        <header className={`relative overflow-hidden px-5 py-5 text-white sm:px-7 ${success ? 'bg-slate-900' : 'bg-[#3c2630]'}`}>
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-inset ring-white/15">
                  <Code2 className="h-3.5 w-3.5" aria-hidden="true" /> Detalle de entrega
                </span>
                <StatusBadge status={execution.queryStatus} compact />
              </div>
              <h2 id="sql-modal-title" className="mt-3 truncate text-xl font-semibold tracking-tight sm:text-2xl">{execution.studentName || 'Sin identificar'}</h2>
              <p className="mt-1 break-all font-mono text-xs text-white/65">{execution.folderName || 'Sin carpeta'}</p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar detalle" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{execution.timestamp || 'Fecha no disponible'}</span>
            {formatBytes(execution.estimatedBytes) && <span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5" aria-hidden="true" />{formatBytes(execution.estimatedBytes)} estimados</span>}
            {execution.commitSha && <span className="font-mono">commit {execution.commitSha.slice(0, 8)}</span>}
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 sm:px-7">
          <div role="tablist" aria-label="Detalle de ejecución" className="flex gap-1">
            {[{ id: 'code', label: 'Código enviado', icon: Code2 }, { id: 'result', label: 'Resultado', icon: Activity }].map(({ id, label, icon: Icon }) => (
              <button key={id} id={`tab-${id}`} role="tab" type="button" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault()
                  const nextTab = id === 'code' ? 'result' : 'code'
                  setTab(nextTab)
                  document.getElementById(`tab-${nextTab}`)?.focus()
                }
              }} className={`inline-flex min-h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${tab === id ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          {tab === 'code' ? (
            <div role="tabpanel" id="panel-code" aria-labelledby="tab-code" tabIndex={0}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-slate-900">Consulta recibida</h3><p className="mt-0.5 text-xs text-slate-500">Contenido exacto del archivo enviado al pipeline.</p></div>
                <button type="button" onClick={copySql} disabled={!execution.sqlText} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? 'Copiado' : 'Copiar SQL'}
                </button>
              </div>
              <SqlCode sql={execution.sqlText} />
            </div>
          ) : (
            <div role="tabpanel" id="panel-result" aria-labelledby="tab-result" tabIndex={0}>
              {success ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                    <div><h3 className="text-sm font-semibold text-emerald-950">Consulta ejecutada correctamente</h3><p className="mt-1 text-sm text-emerald-800">{execution.errorMessage || 'BigQuery completó la consulta sin reportar errores.'}</p></div>
                  </div>
                  <ResultTable rows={execution.resultRows} />
                </div>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
                    <div className="min-w-0"><h3 className="text-base font-semibold text-rose-950">No se pudo completar la consulta</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-rose-900">{friendlyError(execution)}</p>
                      {execution.errorType && <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-700">Tipo: {execution.errorType.replaceAll('_', ' ')}</p>}
                      {execution.errorMessage && execution.errorMessage !== friendlyError(execution) && <details className="mt-4 rounded-xl border border-rose-200 bg-white/70 p-3"><summary className="cursor-pointer text-xs font-semibold text-rose-900">Ver detalle técnico de BigQuery</summary><p className="mt-2 break-words font-mono text-xs leading-5 text-slate-700">{execution.errorMessage}</p></details>}
                      <button type="button" onClick={() => setTab('code')} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-900 px-3.5 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">Revisar código <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-7">
          <p className="text-xs text-slate-500">Laboratorio de Big Data · CESMAG</p>
          <button type="button" onClick={onClose} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">Cerrar</button>
        </footer>
    </dialog>
  )
}

function App() {
  const { executions, loading, error, lastUpdated, refreshMs, refresh } = useExecutions()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortNewest, setSortNewest] = useState(true)
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const metrics = useMemo(() => {
    const success = executions.filter((item) => item.queryStatus === 'success').length
    const failed = executions.length - success
    return { total: executions.length, success, failed, rate: executions.length ? Math.round((success / executions.length) * 100) : 0 }
  }, [executions])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    const result = executions.filter((item) => {
      const matchesTerm = !term || `${item.studentName} ${item.folderName} ${item.errorMessage}`.toLocaleLowerCase().includes(term)
      const matchesStatus = filter === 'all' || item.queryStatus === filter
      return matchesTerm && matchesStatus
    })
    return result.sort((a, b) => {
      const aDate = parseTimestamp(a.timestamp)?.getTime() ?? 0
      const bDate = parseTimestamp(b.timestamp)?.getTime() ?? 0
      return sortNewest ? bDate - aDate : aDate - bDate
    })
  }, [executions, filter, search, sortNewest])

  const clearFilters = () => { setSearch(''); setFilter('all') }
  const relativeUpdated = lastUpdated ? relativeTime(lastUpdated.toISOString(), now) : 'Esperando datos'

  return (
    <div className="min-h-screen bg-[#f4f7f7] text-slate-900 antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-slate-900 focus:shadow-lg">Saltar al contenido</a>
      <header className="relative overflow-hidden bg-[#12232c] text-white">
        <div className="pointer-events-none absolute -right-24 -top-48 h-[32rem] w-[32rem] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-8 -top-32 h-[24rem] w-[24rem] rounded-full border border-white/[0.06]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pb-16 lg:pt-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="#main-content" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-teal-200"><Database className="h-5 w-5" aria-hidden="true" /></span>
              <span><span className="block text-sm font-semibold tracking-wide">CESMAG <span className="font-normal text-white/50">/</span> Big Data</span><span className="mt-0.5 block text-xs text-white/55">Laboratorio académico</span></span>
            </a>
            <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/75" aria-live="polite">
              <span className={`relative flex h-2 w-2 ${error ? '' : 'animate-pulse'}`}><span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${error ? 'bg-rose-400' : 'bg-emerald-400'}`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${error ? 'bg-rose-400' : 'bg-emerald-300'}`} /></span>
              <span>{error ? 'Conexión interrumpida' : 'Monitoreo activo'}</span>
              <span className="hidden text-white/30 sm:inline">·</span>
              <span className="hidden sm:inline">{error ? 'reintentando' : `actualiza cada ${Math.round((refreshMs || 30000) / 1000)} s`}</span>
            </div>
          </div>

          <div className="mt-11 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Panel de seguimiento</p>
              <h1 className="mt-3 min-w-0 max-w-full break-words text-balance text-3xl font-semibold tracking-tight sm:max-w-3xl sm:text-4xl lg:text-[2.75rem]">Ejecuciones SQL,<br className="hidden sm:block" /> con todo bajo control.</h1>
              <p className="mt-4 min-w-0 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Consulta las entregas del curso, revisa su estado y explora lo que BigQuery ejecutó.</p>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <Clock3 className="h-4 w-4 text-teal-200" aria-hidden="true" />
              <span><span className="block text-[11px] uppercase tracking-wider text-white/45">Última actualización</span><span className="mt-0.5 block font-medium">{relativeUpdated}</span></span>
              <button type="button" onClick={refresh} disabled={loading} aria-label="Actualizar entregas" className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="relative z-10 mx-auto -mt-7 w-full min-w-0 max-w-7xl overflow-x-clip px-4 pb-12 sm:px-6 lg:px-8">
        {error && (
          <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white p-4 shadow-lg shadow-rose-900/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">No se pudieron actualizar las entregas</p><p className="mt-1 text-sm text-slate-600">Revisa la conexión con la API. Volveremos a intentarlo automáticamente.</p></div></div>
            <button type="button" onClick={refresh} className="min-h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">Reintentar ahora</button>
          </div>
        )}

        <section aria-label="Resumen de entregas" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Entregas recibidas" value={loading && !executions.length ? '—' : metrics.total} detail="En el registro del laboratorio" icon={FileCode2} tone="bg-slate-100 text-slate-700" onClick={() => setFilter('all')} active={filter === 'all'} />
          <MetricCard label="Ejecuciones exitosas" value={loading && !executions.length ? '—' : metrics.success} detail="Consultas completadas en BigQuery" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" onClick={() => setFilter('success')} active={filter === 'success'} />
          <MetricCard label="Requieren revisión" value={loading && !executions.length ? '—' : metrics.failed} detail="Errores de sintaxis, permisos u otros" icon={CircleAlert} tone="bg-rose-50 text-rose-700" onClick={() => setFilter('error')} active={filter === 'error'} />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">Tasa de éxito</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{loading && !executions.length ? '—' : `${metrics.rate}%`}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Activity className="h-5 w-5" aria-hidden="true" /></span></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Porcentaje de ejecuciones exitosas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={metrics.rate}><div className="h-full rounded-full bg-teal-600 transition-[width] duration-500" style={{ width: `${metrics.rate}%` }} /></div>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="deliveries-title">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div><div className="flex items-center gap-2"><h2 id="deliveries-title" className="text-lg font-semibold tracking-tight text-slate-950">Entregas recientes</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{filtered.length}</span></div><p className="mt-1 text-sm text-slate-500">Busca por estudiante, carpeta o mensaje del error.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <label htmlFor="delivery-search" className="sr-only">Buscar entregas</label>
                  <input id="delivery-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, ruta o error..." autoComplete="off" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/15" />
                </div>
                <button type="button" onClick={() => setSortNewest((value) => !value)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" aria-label={`Ordenar por fecha, actualmente ${sortNewest ? 'más recientes primero' : 'más antiguas primero'}`}>
                  <ArrowDownUp className="h-4 w-4" aria-hidden="true" /><span className="sm:hidden">Ordenar</span><span className="hidden sm:inline">{sortNewest ? 'Más recientes' : 'Más antiguas'}</span>
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtros rápidos por estado">
              {FILTERS.map(({ key, label }) => {
                const count = key === 'all' ? metrics.total : key === 'success' ? metrics.success : metrics.failed
                const active = filter === key
                return <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={active} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${active ? 'bg-[#12232c] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}<span className={`rounded-full px-1.5 py-0.5 tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-white text-slate-600'}`}>{count}</span></button>
              })}
              {(search || filter !== 'all') && <button type="button" onClick={clearFilters} className="ml-auto inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">Limpiar filtros <X className="h-3.5 w-3.5" aria-hidden="true" /></button>}
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true" className="sr-only">{loading ? 'Cargando entregas' : `${filtered.length} entregas visibles`}</div>
          <div className="p-3 sm:p-4">
            {loading && executions.length === 0 ? <LoadingState /> : error && executions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-14 text-center"><CircleAlert className="mx-auto h-7 w-7 text-rose-600" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-900">No hay datos disponibles</h3><p className="mt-1 text-sm text-slate-600">La conexión falló. Usa “Reintentar ahora” para volver a consultar.</p></div>
            ) : filtered.length === 0 ? <EmptyState searched={Boolean(search || filter !== 'all')} search={search} onClear={clearFilters} /> : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                  <table className="w-full text-left">
                    <caption className="sr-only">Estado, estudiante, archivo, fecha y detalle de cada entrega SQL</caption>
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500"><th scope="col" className="px-5 py-3.5 font-semibold">Estado</th><th scope="col" className="px-5 py-3.5 font-semibold">Estudiante</th><th scope="col" className="px-5 py-3.5 font-semibold">Archivo de entrega</th><th scope="col" className="px-5 py-3.5 font-semibold">Enviada</th><th scope="col" className="px-5 py-3.5 text-right font-semibold">Detalle</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((item, index) => <tr key={item.id} className="group transition-colors hover:bg-teal-50/40" style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}>
                        <td className="px-5 py-4"><StatusBadge status={item.queryStatus} compact /></td>
                        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(item.studentName)}`}>{initials(item.studentName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.studentName || 'Sin identificar'}</p><p className="mt-0.5 text-xs text-slate-500">{item.commitSha ? `commit ${item.commitSha.slice(0, 7)}` : 'Entrega SQL'}</p></div></div></td>
                        <td className="px-5 py-4"><div className="flex min-w-0 items-center gap-2"><FileCode2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /><span title={item.folderName} className="max-w-[22rem] truncate font-mono text-xs text-slate-600">{item.folderName || 'Sin carpeta'}</span></div></td>
                        <td className="whitespace-nowrap px-5 py-4"><span title={item.timestamp} className="text-sm text-slate-700">{relativeTime(item.timestamp)}</span></td>
                        <td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><Code2 className="h-4 w-4" aria-hidden="true" /> Ver detalle</button></td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-3 md:hidden" aria-label="Entregas SQL">
                  {filtered.map((item) => <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(item.studentName)}`}>{initials(item.studentName)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.studentName || 'Sin identificar'}</p><p className="mt-1 truncate font-mono text-xs text-slate-500">{item.folderName || 'Sin carpeta'}</p></div><StatusBadge status={item.queryStatus} compact /></div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500" title={item.timestamp}>{relativeTime(item.timestamp)}</span><button type="button" onClick={() => setSelected(item)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#12232c] px-3.5 text-xs font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><Code2 className="h-4 w-4" aria-hidden="true" /> Ver detalle</button></div>
                  </li>)}
                </ul>
              </>
            )}
          </div>
          {!loading && !error && executions.length > 0 && <div className="flex flex-col gap-1 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Mostrando {filtered.length} de {executions.length} entregas</span><span>Actualización automática cada {Math.round((refreshMs || 30000) / 1000)} segundos</span></div>}
        </section>

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 px-1 text-xs text-slate-500 sm:flex-row"><span>Laboratorio de Big Data · Universidad CESMAG</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> Datos conectados a BigQuery</span></footer>
      </main>

      <SqlModal execution={selected} onClose={() => setSelected(null)} />
      <span className="sr-only" aria-hidden="true">{now}</span>
    </div>
  )
}

export default App
