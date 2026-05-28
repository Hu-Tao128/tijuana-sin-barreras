import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PLACEHOLDER_DATA = [
  { colonia: 'Centro', reportes: 42 },
  { colonia: 'Zona Río', reportes: 28 },
  { colonia: 'Otay', reportes: 19 },
  { colonia: 'La Mesa', reportes: 15 },
]

export function StatsOverviewChart() {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={PLACEHOLDER_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="colonia" tick={{ fill: 'var(--text)' }} />
          <YAxis tick={{ fill: 'var(--text)' }} />
          <Tooltip />
          <Bar dataKey="reportes" fill="#9B2247" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
