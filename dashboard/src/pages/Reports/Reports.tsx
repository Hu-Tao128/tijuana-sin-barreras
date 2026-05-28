import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  createReport,
  deleteReport,
  setReportStatus,
  subscribeToReports,
} from '../../services'
import {
  BARRIER_TYPE_LABELS,
  BarrierType,
  REPORT_STATUS_LABELS,
  ReportStatus,
  type Report,
} from '../../types'
import '../../App.css'

const TIJUANA_CENTER = { lat: 32.5149, lng: -117.0382 }

const EMPTY_FORM = {
  type: BarrierType.BROKEN_SIDEWALK as BarrierType,
  severity: 5,
  description: '',
  latitude: String(TIJUANA_CENTER.lat),
  longitude: String(TIJUANA_CENTER.lng),
}

export function Reports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const unsubscribe = subscribeToReports(
      (data) => {
        setReports(data)
        setLoading(false)
      },
      () => {
        setError('No se pudieron cargar los reportes. Revisa las reglas de Realtime Database.')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createReport({
        userId: user?.uid ?? 'dashboard',
        type: form.type,
        severity: Number(form.severity),
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      })
      setForm(EMPTY_FORM)
      setIsCreating(false)
    } catch {
      setError('No se pudo crear el reporte. Verifica permisos de escritura.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatus(reportId: string, status: ReportStatus) {
    setError(null)
    setPendingId(reportId)
    try {
      await setReportStatus(reportId, status)
    } catch {
      setError('No se pudo actualizar el estado del reporte.')
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete(reportId: string) {
    setError(null)
    setPendingId(reportId)
    try {
      await deleteReport(reportId)
    } catch {
      setError('No se pudo borrar el reporte.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div>
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Gestión de reportes</h2>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setIsCreating((prev) => !prev)}
          >
            {isCreating ? 'Cancelar' : 'Crear reporte'}
          </button>
        </div>
        <p className="metric-meta">
          Datos en vivo desde Realtime Database. Confirma, descarta o borra reportes.
        </p>

        {isCreating && (
          <form className="report-form report-form--full" onSubmit={handleCreate}>
            <label>
              Tipo de barrera
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BarrierType }))}
              >
                {Object.values(BarrierType).map((type) => (
                  <option key={type} value={type}>
                    {BARRIER_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severidad (1-10)
              <input
                type="number"
                min={1}
                max={10}
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                required
              />
            </label>
            <label>
              Latitud
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                required
              />
            </label>
            <label>
              Longitud
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                required
              />
            </label>
            <label className="report-form__wide">
              Descripción
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar reporte'}
            </button>
          </form>
        )}

        {error && (
          <p className="login-card__error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="metric-meta">Cargando reportes…</p>
        ) : reports.length === 0 ? (
          <p className="metric-meta">No hay reportes registrados.</p>
        ) : (
          <div className="reports-table">
            <div className="reports-table__head">
              <span>ID</span>
              <span>Tipo</span>
              <span>Severidad</span>
              <span>Fecha</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {reports.map((item) => (
              <div key={item.id} className="reports-table__row">
                <span title={item.id}>{item.id.slice(0, 8)}</span>
                <span>{BARRIER_TYPE_LABELS[item.type] ?? item.type}</span>
                <span>{item.severity}</span>
                <span>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                </span>
                <span className={`report-status report-status--${item.status}`}>
                  {REPORT_STATUS_LABELS[item.status] ?? item.status}
                </span>
                <div className="reports-table__actions">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => void handleStatus(item.id, ReportStatus.VERIFIED)}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => void handleStatus(item.id, ReportStatus.REJECTED)}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label="Borrar reporte"
                    disabled={pendingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
