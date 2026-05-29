import { useEffect, useMemo, useState } from 'react'
import { ReportsTrendChart, ZonesBarChart, type TrendDatum, type ZoneDatum } from '../../charts'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { subscribeToReports } from '../../services'
import { ReportStatus, type Report } from '../../types'
import '../../App.css'

type Period = 'hoy' | 'semana' | 'mes'

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
  const { t } = useAppSettings()
  const labels: Record<Period, string> = {
    hoy: t('period.day'),
    semana: t('period.week'),
    mes: t('period.month'),
  }

  return (
    <select
      className="period-selector"
      aria-label={t('period.select')}
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
    >
      {(Object.keys(labels) as Period[]).map((period) => (
        <option key={period} value={period}>
          {labels[period]}
        </option>
      ))}
    </select>
  )
}

function buildTypeData(reports: Report[], t: (key: string) => string): ZoneDatum[] {
  const counts = new Map<string, number>()
  for (const report of reports) {
    counts.set(report.type, (counts.get(report.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, reportes]) => ({
      colonia: t(`barrierType.${type}`),
      reportes,
    }))
    .sort((a, b) => b.reportes - a.reportes)
}

const MONTH_KEYS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

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
    buckets.push({ periodo: MONTH_KEYS[monthDate.getMonth()], reportes })
  }
  return buckets
}

export function Home() {
  const { t } = useAppSettings()
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

  const typeData = useMemo(() => buildTypeData(reports, t), [reports, t])
  const trendData = useMemo(() => buildTrendData(reports), [reports])

  const periodLabel = (period: Period) =>
    ({ hoy: t('period.day'), semana: t('period.week'), mes: t('period.month') })[period]

  return (
    <div>
      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>{t('home.reports')}</h2>
            <PeriodSelector value={reportsPeriod} onChange={setReportsPeriod} />
          </div>
          <p className="metric-value">{receivedCount}</p>
          <p className="metric-meta">
            {t('home.received')} · {periodLabel(reportsPeriod)}
          </p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>{t('home.active')}</h2>
          </div>
          <p className="metric-value">{activeCount}</p>
          <p className="metric-meta">{t('home.pendingReview')}</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>{t('home.resolved')}</h2>
            <PeriodSelector value={resolvedPeriod} onChange={setResolvedPeriod} />
          </div>
          <p className="metric-value">{resolvedCount}</p>
          <p className="metric-meta">
            {t('home.verified')} · {periodLabel(resolvedPeriod)}
          </p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--top-margin">
        <article className="dashboard-card">
          <h2>{t('home.byType')}</h2>
          <ZonesBarChart data={typeData} />
        </article>
        <article className="dashboard-card">
          <h2>{t('home.byMonth')}</h2>
          <ReportsTrendChart data={trendData} />
        </article>
      </section>
    </div>
  )
}
