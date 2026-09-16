import { useEffect, useState } from 'react'

// MODO 100% EN VIVO — sin datos de prueba.
// ÚNICO punto de acceso a datos del dashboard.
// Requiere en dashboard/.env.local:
//   VITE_API_URL=https://REGION-PROJECT.cloudfunctions.net/executions-api
//   VITE_REFRESH_MS=30000
// El endpoint debe devolver un JSON con shape:
//   [{ id, studentName, folderName, queryStatus: 'success' | 'error', timestamp }]
// Sin VITE_API_URL o si el fetch falla: error visible + executions=[].
// No hay fallback a mockData.js (se conserva el archivo solo como referencia).
const API_URL = import.meta.env.VITE_API_URL

// Intervalo de polling (ms). Default 30000. Acepta solo números > 0.
const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_MS || 30000) || 30000

const LIVE_ERROR =
  'No se pudo conectar a la API en vivo (VITE_API_URL). Revisa .env.local y que executions-api esté desplegada.'

// Normaliza cualquier fila de la API real al shape del dashboard.
function formatTimestamp(value) {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (!text) return ''
  // Si ya viene en formato display ("2023-10-25 10:00 AM"), devolver tal cual.
  if (/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} (AM|PM)$/.test(text)) return text
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  let hh = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${yyyy}-${mm}-${dd} ${String(hh).padStart(2, '0')}:${min} ${ampm}`
}

function normalizeExecution(item, index) {
  const rawStatus = String(item?.queryStatus ?? item?.status ?? '').toUpperCase()
  return {
    id: item?.id ?? index + 1,
    studentName: item?.studentName ?? item?.author ?? 'Desconocido',
    folderName: item?.folderName ?? item?.repo_file ?? item?.gcs_path ?? '—',
    queryStatus: rawStatus === 'SUCCESS' ? 'success' : 'error',
    timestamp: formatTimestamp(item?.timestamp ?? item?.validated_at ?? ''),
  }
}

export function useExecutions() {
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      if (!API_URL) {
        if (cancelled) return
        setExecutions([])
        setError(LIVE_ERROR)
        setLoading(false)
        return
      }
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`API respondió ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        if (!Array.isArray(data)) throw new Error('Respuesta inesperada de la API')
        // Tabla vacía ([]) es un vacío válido: se respeta sin inventar filas.
        setExecutions(data.map(normalizeExecution))
        setError(null)
        setLoading(false)
      } catch {
        if (cancelled) return
        setExecutions([])
        setError(LIVE_ERROR)
        setLoading(false)
      }
    }

    fetchData()
    const intervalId = setInterval(fetchData, REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  // usingFallback se mantiene en false solo por compatibilidad con
  // consumidores antiguos; el modo prueba ya no existe.
  return { executions, loading, error, usingFallback: false }
}
