import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { useAppSettings } from '../contexts/AppSettingsContext'
import type { Report } from '../types'
import './ReportsHeatmap.css'

const TIJUANA_CENTER: [number, number] = [32.5149, -117.0382]

type HeatPoint = [number, number, number]

/** Capa de calor sobre el mapa, ponderada por severidad del reporte. */
function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return

    // El tipado de leaflet.heat no expone heatLayer en el namespace L.
    const layer = (L as unknown as {
      heatLayer: (pts: HeatPoint[], opts?: Record<string, unknown>) => L.Layer
    }).heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.3: '#2563eb', 0.6: '#f59e0b', 0.9: '#9b2247' },
    })

    layer.addTo(map)
    return () => {
      layer.remove()
    }
  }, [map, points])

  return null
}

export function ReportsHeatmap({ reports }: { reports: Report[] }) {
  const { t } = useAppSettings()
  const points: HeatPoint[] = reports
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => [r.latitude, r.longitude, Math.min(Math.max(r.severity, 1), 10) / 10])

  return (
    <div className="reports-heatmap">
      <MapContainer center={TIJUANA_CENTER} zoom={12} className="reports-heatmap__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
      </MapContainer>

      <div className="reports-heatmap__legend" aria-label="Leyenda del mapa de calor">
        <span className="reports-heatmap__legend-title">{t('heatmap.legend')}</span>
        <div className="reports-heatmap__legend-bar" />
        <div className="reports-heatmap__legend-labels">
          <span>{t('heatmap.low')}</span>
          <span>{t('heatmap.high')}</span>
        </div>
        <span className="reports-heatmap__legend-count">
          {t('heatmap.count', { count: points.length })}
        </span>
      </div>
    </div>
  )
}
