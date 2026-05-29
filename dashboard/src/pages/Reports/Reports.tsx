import { useEffect, useState } from 'react'
import { MapPin, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { LocationPickerModal } from '../../maps'
import {
  createReport,
  deleteReport,
  setReportStatus,
  subscribeToReports,
} from '../../services'
import { BarrierType, ReportStatus, type Report } from '../../types'
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
  const { t } = useAppSettings()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToReports(
      (data) => {
        setReports(data)
        setLoading(false)
      },
      () => {
        setError(t('reports.loadError'))
        setLoading(false)
      },
    )
    return unsubscribe
  }, [t])

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
      setError(t('reports.createError'))
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
      setError(t('reports.updateError'))
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
      setError(t('reports.deleteError'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div>
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>{t('reports.title')}</h2>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setIsCreating((prev) => !prev)}
          >
            {isCreating ? t('reports.cancel') : t('reports.create')}
          </button>
        </div>
        <p className="metric-meta">{t('reports.liveData')}</p>

        {isCreating && (
          <form className="report-form report-form--full" onSubmit={handleCreate}>
            <label>
              {t('reports.barrierType')}
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BarrierType }))}
              >
                {Object.values(BarrierType).map((type) => (
                  <option key={type} value={type}>
                    {t(`barrierType.${type}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('reports.severity')}
              <input
                type="number"
                min={1}
                max={10}
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                required
              />
            </label>
            <label className="report-form__location">
              {t('reports.location')}
              <button
                type="button"
                className="secondary-btn report-form__location-btn"
                onClick={() => setIsPickerOpen(true)}
              >
                <MapPin size={15} aria-hidden="true" />
                {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
              </button>
              <span className="report-form__location-hint">{t('reports.pickOnMap')}</span>
            </label>
            <label className="report-form__wide">
              {t('reports.description')}
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('reports.optional')}
              />
            </label>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? t('reports.saving') : t('reports.save')}
            </button>
          </form>
        )}

        {error && (
          <p className="login-card__error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="metric-meta">{t('reports.loading')}</p>
        ) : reports.length === 0 ? (
          <p className="metric-meta">{t('reports.empty')}</p>
        ) : (
          <div className="reports-table">
            <div className="reports-table__head">
              <span>{t('reports.id')}</span>
              <span>{t('reports.type')}</span>
              <span>{t('reports.severityCol')}</span>
              <span>{t('reports.date')}</span>
              <span>{t('reports.status')}</span>
              <span>{t('reports.actions')}</span>
            </div>
            {reports.map((item) => (
              <div key={item.id} className="reports-table__row">
                <span title={item.id}>{item.id.slice(0, 8)}</span>
                <span>{t(`barrierType.${item.type}`)}</span>
                <span>{item.severity}</span>
                <span>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                </span>
                <span className={`report-status report-status--${item.status}`}>
                  {t(`reportStatus.${item.status}`)}
                </span>
                <div className="reports-table__actions">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => void handleStatus(item.id, ReportStatus.VERIFIED)}
                  >
                    {t('reports.confirm')}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => void handleStatus(item.id, ReportStatus.REJECTED)}
                  >
                    {t('reports.discard')}
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label={t('reports.delete')}
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

      {isPickerOpen && (
        <LocationPickerModal
          initial={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
          onConfirm={({ lat, lng }) => {
            setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))
            setIsPickerOpen(false)
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </div>
  )
}
