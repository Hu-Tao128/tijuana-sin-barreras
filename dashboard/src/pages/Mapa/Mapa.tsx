import { useEffect, useState } from 'react'
import { ReportsHeatmap } from '../../maps'
import { subscribeToReports } from '../../services'
import type { Report } from '../../types'
import '../../App.css'

export function Mapa() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => setReports(data))
    return unsubscribe
  }, [])

  return (
    <article className="dashboard-card dashboard-card--wide">
      <ReportsHeatmap reports={reports} />
    </article>
  )
}
