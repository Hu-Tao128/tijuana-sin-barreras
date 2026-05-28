import { StatsOverviewChart } from '../../charts'
import { PageHeader } from '../../components/layout/PageHeader'
import { TijuanaMap } from '../../maps'
import '../../App.css'

export function Home() {
  return (
    <div className="page-main">
      <PageHeader title="Inicio" />
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
    </div>
  )
}
