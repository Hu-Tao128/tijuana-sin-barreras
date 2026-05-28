import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PLACEHOLDER_DATA = [
  { periodo: 'Ene', reportes: 30 },
  { periodo: 'Feb', reportes: 45 },
  { periodo: 'Mar', reportes: 38 },
  { periodo: 'Abr', reportes: 60 },
  { periodo: 'May', reportes: 52 },
  { periodo: 'Jun', reportes: 71 },
]

export function ReportsTrendChart() {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={PLACEHOLDER_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="periodo" tick={{ fill: 'var(--text)' }} />
          <YAxis tick={{ fill: 'var(--text)' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="reportes"
            stroke="#9B2247"
            strokeWidth={2}
            dot={{ r: 3, fill: '#9B2247' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
