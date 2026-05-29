import { useState } from 'react'
import { ReportsTrendChart, ZonesBarChart } from '../../charts'
import '../../App.css'

type Period = 'hoy' | 'semana' | 'mes'

const PERIOD_LABELS: Record<Period, string> = {
  hoy: 'Día',
  semana: 'Semana',
  mes: 'Mes',
}

const REPORTS_BY_PERIOD: Record<Period, number> = { hoy: 18, semana: 87, mes: 342 }
const RESOLVED_BY_PERIOD: Record<Period, number> = { hoy: 9, semana: 54, mes: 221 }

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

export function Home() {
  const [reportsPeriod, setReportsPeriod] = useState<Period>('semana')
  const [resolvedPeriod, setResolvedPeriod] = useState<Period>('semana')

  return (
    <div>
      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes</h2>
            <PeriodSelector value={reportsPeriod} onChange={setReportsPeriod} />
          </div>
          <p className="metric-value">{REPORTS_BY_PERIOD[reportsPeriod]}</p>
          <p className="metric-meta">Reportes recibidos · {PERIOD_LABELS[reportsPeriod]}</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes activos</h2>
          </div>
          <p className="metric-value">34</p>
          <p className="metric-meta">En seguimiento actualmente</p>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Reportes resueltos</h2>
            <PeriodSelector value={resolvedPeriod} onChange={setResolvedPeriod} />
          </div>
          <p className="metric-value">{RESOLVED_BY_PERIOD[resolvedPeriod]}</p>
          <p className="metric-meta">Resueltos · {PERIOD_LABELS[resolvedPeriod]}</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--top-margin">
        <article className="dashboard-card">
          <h2>Zonas con más reportes</h2>
          <ZonesBarChart />
        </article>
        <article className="dashboard-card">
          <h2>Reportes por mes</h2>
          <ReportsTrendChart />
        </article>
      </section>
    </div>
  )
}
