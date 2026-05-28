import { PageHeader } from '../../components/layout/PageHeader'
import { TijuanaMap } from '../../maps'
import '../../App.css'

export function HeatMap() {
  return (
    <div className="page-main">
      <PageHeader title="Mapa de calor" />
      <article className="dashboard-card">
        <TijuanaMap />
      </article>
    </div>
  )
}
