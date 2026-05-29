import { useEffect, useMemo, useState } from 'react'
import { ReportsTrendChart, ZonesBarChart, type TrendDatum, type ZoneDatum } from '../../charts'
import { subscribeToReports } from '../../services'
import { BARRIER_TYPE_LABELS, ReportStatus, type Report } from '../../types'
import '../../App.css'

type Period = 'hoy' | 'semana' | 'mes'

const PERIOD_LABELS: Record<Period, string> = {
  hoy: 'Día',
  semana: 'Semana',
  mes: 'Mes',
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Marca de tiempo a partir de la cual cuenta cada periodo. */
function periodStart(period: Period): number {
  const now = new Date()
  if (period === 'hoy') {
    now.setHours(0, 0, 0, 0)
    return now.getTime()
  }
  const days = period === 'semana' ? 7 : 30
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period
  onChange: (period: Period) => void
}) {
  return (
    <select
      className="period-selector"
      aria-label="Seleccionar periodo"
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
    >
      {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
        <option key={period} value={period}>
          {PERIOD_LABELS[period]}
        </option>
      ))}
    </select>
  )
}

/** Reportes por tipo de barrera, ordenados de mayor a menor. */
function buildTypeData(reports: Report[]): ZoneDatum[] {
  const counts = new Map<string, number>()
  for (const report of reports) {
    counts.set(report.type, (counts.get(report.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, reportes]) => ({
      colonia: BARRIER_TYPE_LABELS[type as keyof typeof BARRIER_TYPE_LABELS] ?? type,
      reportes,
    }))
    .sort((a, b) => b.reportes - a.reportes)
}

/** Reportes por mes en los últimos 6 meses. */
function buildTrendData(reports: Report[]): TrendDatum[] {
  const buckets: TrendDatum[] = []
  const base = new Date()
  base.setDate(1)
  base.setHours(0, 0, 0, 0)

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const start = monthDate.getTime()
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).getTime()
    const reportes = reports.filter((r) => r.createdAt >= start && r.createdAt < end).length
    buckets.push({ periodo: MONTH_LABELS[monthDate.getMonth()], reportes })
  }
  return buckets
}

export function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [reportsPeriod, setReportsPeriod] = useState<Period>('semana')
  const [resolvedPeriod, setResolvedPeriod] = useState<Period>('semana')

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => setReports(data))
    return unsubscribe
  }, [])

  const receivedCount = useMemo(() => {
    const start = periodStart(reportsPeriod)
    return reports.filter((r) => r.createdAt >= start).length
  }, [reports, reportsPeriod])

  const activeCount = useMemo(
    () => reports.filter((r) => r.status === ReportStatus.PENDING).length,
    [reports],
  )

  const resolvedCount = useMemo(() => {
    const start = periodStart(resolvedPeriod)
    return reports.filter(
      (r) => r.status === ReportStatus.VERIFIED && (r.updatedAt ?? r.createdAt) >= start,
    ).length
  }, [reports, resolvedPeriod])

  const typeData = useMemo(() => buildTypeData(reports), [reports])
  const trendData = useMemo(() => buildTrendData(reports), [reports])

  return (
    <div>
      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes</h2>
            <PeriodSelector value={reportsPeriod} onChange={setReportsPeriod} />
          </div>
          <p className="metric-value">{receivedCount}</p>
          <p className="metric-meta">Reportes recibidos · {PERIOD_LABELS[reportsPeriod]}</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes activos</h2>
          </div>
          <p className="metric-value">{activeCount}</p>
          <p className="metric-meta">Pendientes de revisión</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes resueltos</h2>
            <PeriodSelector value={resolvedPeriod} onChange={setResolvedPeriod} />
          </div>
          <p className="metric-value">{resolvedCount}</p>
          <p className="metric-meta">Verificados · {PERIOD_LABELS[resolvedPeriod]}</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--top-margin">
        <article className="dashboard-card">
          <h2>Reportes por tipo de barrera</h2>
          <ZonesBarChart data={typeData} />
        </article>
        <article className="dashboard-card">
          <h2>Reportes por mes</h2>
          <ReportsTrendChart data={trendData} />
        </article>
      </section>
    </div>
  )
}
