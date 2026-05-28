import { DashboardLayout } from '../../components'
import { TijuanaMap } from '../../maps'

export function HeatMap() {
  return (
    <DashboardLayout title="Mapa de calor">
      <TijuanaMap />
    </DashboardLayout>
  )
}
