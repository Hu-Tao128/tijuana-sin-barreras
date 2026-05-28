import { DashboardLayout } from '../../components'
import { StatsOverviewChart } from '../../charts'
import { TijuanaMap } from '../../maps'

export function Home() {
  return (
    <DashboardLayout title="Panel gubernamental">
      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card--wide">
          <h2>Mapa de incidencias</h2>
          <TijuanaMap />
        </article>
        <article className="dashboard-card">
          <h2>Resumen de reportes</h2>
          <StatsOverviewChart />
        </article>
      </section>
    </DashboardLayout>
  )
}
