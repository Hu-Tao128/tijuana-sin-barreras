import { DashboardLayout } from '../../components'
import { StatsOverviewChart } from '../../charts'

export function Analytics() {
  return (
    <DashboardLayout title="Analítica">
      <StatsOverviewChart />
    </DashboardLayout>
  )
}
