import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Database,
  FileCode2,
  Folder,
  Inbox,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { useExecutions } from './api.js'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'success', label: 'Exitosos' },
  { key: 'error', label: 'Fallidos' },
]

// SQL de ejemplo para la vista "Ver SQL". Cuando exista API real,
// este campo vendrá del backend (executions[].query).
function sampleQuery(execution) {
  const table = execution.folderName.replace(/[^a-z0-9_]/gi, '_').toLowerCase()
  return `-- ${execution.folderName} / ${execution.studentName}\nSELECT *\nFROM \`laboratorio-bigdata.cesmag.${table}\`\nLIMIT 100;`
}

function StatusBadge({ status }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Ejecución Exitosa
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      Fallo en Sintaxis/Ejecución
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-busy="true" aria-label="Cargando entregas">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0 sm:px-6">
          <div className="h-6 w-32 rounded-full bg-slate-100" />
          <div className="hidden h-4 w-48 rounded bg-slate-100 sm:block" />
          <div className="hidden h-4 w-32 rounded bg-slate-100 md:block" />
          <div className="ml-auto h-4 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">Sin resultados</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No hay entregas que coincidan con la búsqueda o el filtro seleccionado.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
      >
        Limpiar búsqueda y filtros
      </button>
    </div>
  )
}

function SqlModal({ execution, onClose }) {
  useEffect(() => {
    if (!execution) return
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [execution, onClose])

  if (!execution) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sql-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="sql-modal-title" className="text-sm font-semibold text-slate-900">
              Consulta SQL — {execution.studentName}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{execution.folderName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Cerrar vista de SQL"
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <StatusBadge status={execution.queryStatus} />
          <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{sampleQuery(execution)}</code>
          </pre>
          {execution.queryStatus === 'error' && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-600/20">
              La validación en BigQuery reportó un fallo de sintaxis o de ejecución para esta
              entrega. Revisa la consulta y vuelve a subir el archivo .sql.
            </p>
          )}
          <p className="text-xs text-slate-500">Registrado: {execution.timestamp}</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { executions, loading, error } = useExecutions()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const searched = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return executions
    return executions.filter(
      (item) =>
        item.studentName.toLowerCase().includes(term) ||
        item.folderName.toLowerCase().includes(term),
    )
  }, [executions, search])

  const counts = useMemo(
    () => ({
      all: searched.length,
      success: searched.filter((item) => item.queryStatus === 'success').length,
      error: searched.filter((item) => item.queryStatus === 'error').length,
    }),
    [searched],
  )

  const visible = useMemo(
    () => (filter === 'all' ? searched : searched.filter((item) => item.queryStatus === filter)),
    [searched, filter],
  )

  // Contador del encabezado: refleja la vista actual (búsqueda + filtro).
  // Sin filtros equivale al global: 15/20 Entregas exitosas.
  const successCount = visible.filter((item) => item.queryStatus === 'success').length
  const totalCount = visible.length
  const progress = totalCount === 0 ? 0 : Math.round((successCount / totalCount) * 100)

  const clearAll = () => {
    setSearch('')
    setFilter('all')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                <Database className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-lg font-semibold leading-tight sm:text-xl">
                  Laboratorio de Big Data - CESMAG
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  Monitor de Ejecución SQL
                </p>
              </div>
            </div>
            <div className="w-full md:max-w-xs" aria-live="polite">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-base font-semibold text-slate-900">
                    {successCount}/{totalCount}
                  </span>{' '}
                  Entregas exitosas
                </p>
                <p className="text-xs tabular-nums text-slate-500">{progress}%</p>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${successCount} de ${totalCount} entregas exitosas`}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}
        {/* Toolbar */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="search" className="sr-only">
                Buscar por estudiante o carpeta
              </label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por estudiante o carpeta…"
                autoComplete="off"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
              {FILTERS.map(({ key, label }) => {
                const active = filter === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
                      active
                        ? 'bg-slate-900 text-white ring-slate-900'
                        : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {label}
                    <span
                      className={`rounded-full px-1.5 text-xs tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          {(search.trim() !== '' || filter !== 'all') && (
            <p className="mt-3 text-xs text-slate-500" aria-live="polite">
              Mostrando {visible.length} de {executions.length} entregas
              {search.trim() !== '' && (
                <>
                  {' '}para <span className="font-medium text-slate-700">“{search.trim()}”</span>
                </>
              )}
              .{' '}
              <button
                type="button"
                onClick={clearAll}
                className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                Limpiar
              </button>
            </p>
          )}
        </div>

        {/* Contenido */}
        <div className="mt-4">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center rounded-lg border border-red-200 bg-white px-6 py-16 text-center shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                No se pudo cargar la API en vivo
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Reintentar
              </button>
            </div>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                Sin entregas todavía
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Sin entregas en BigQuery todavía — haz push de un .sql en
                estudiantes/
              </p>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <>
              {/* Tabla en desktop */}
              <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Entregas de consultas SQL validadas en BigQuery
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="px-6 py-3 font-medium">Estado</th>
                      <th scope="col" className="px-6 py-3 font-medium">Estudiante</th>
                      <th scope="col" className="px-6 py-3 font-medium">Carpeta</th>
                      <th scope="col" className="px-6 py-3 font-medium">Fecha</th>
                      <th scope="col" className="px-6 py-3 text-right font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <StatusBadge status={item.queryStatus} />
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">{item.studentName}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                            <Folder className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            {item.folderName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-slate-500">{item.timestamp}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                          >
                            <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver SQL
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards en móvil */}
              <ul className="space-y-3 md:hidden">
                {visible.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.studentName}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                          <Folder className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          {item.folderName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={item.queryStatus} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">{item.timestamp}</p>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                      >
                        <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Ver SQL
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <footer className="mt-6 text-center text-xs text-slate-400">
          Laboratorio de Big Data - CESMAG · {executions.length} entregas monitoreadas
        </footer>
      </main>

      <SqlModal execution={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
