import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { analyzeRouteAccessibility, type RouteAccessibilityReport } from '../services/gemini'
import { PhotonAutocomplete, type PlaceResult } from './PhotonAutocomplete'
import './RoutePlanner.css'

const TIJUANA_CENTER: LatLngExpression = [32.5149, -117.0382]

// Máximo de puntos de la ruta que se evalúan.
const MAX_AUDIT_POINTS = 8

// Instancia pública FOSSGIS de OSRM con perfil peatonal (sin API key).
const OSRM_FOOT_ENDPOINT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

type LatLng = { lat: number; lng: number }

/** Toma como máximo `max` elementos repartidos uniformemente en el arreglo. */
function pickEvenly<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = (arr.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)])
}

async function fetchWalkingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<{ positions: [number, number][]; distanceMeters: number } | null> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const url = `${OSRM_FOOT_ENDPOINT}/${coords}?overview=full&geometries=geojson`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = (await response.json()) as {
    routes?: Array<{
      distance: number
      geometry: { coordinates: [number, number][] }
    }>
  }

  const route = data.routes?.[0]
  if (!route) return null

  // GeoJSON entrega [lng, lat]; Leaflet usa [lat, lng].
  const positions = route.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number],
  )
  return { positions, distanceMeters: route.distance }
}

function RouteReportCard({
  report,
  distanceMeters,
}: {
  report: RouteAccessibilityReport
  distanceMeters: number
}) {
  const { t } = useAppSettings()
  const meta =
    report.scoreAccesibilidad >= 75
      ? { label: t('routes.good'), tone: 'bajo' as const }
      : report.scoreAccesibilidad >= 50
        ? { label: t('routes.medium'), tone: 'medio' as const }
        : { label: t('routes.low'), tone: 'alto' as const }
  const counts = { alto: 0, medio: 0, bajo: 0 }
  for (const point of report.puntosControl) {
    counts[point.riesgo] = (counts[point.riesgo] ?? 0) + 1
  }

  return (
    <div className="route-planner__report">
      <div className="route-planner__basis route-planner__basis--prelim">{t('routes.aiRating')}</div>

      <div className="route-planner__report-head">
        <div className={`route-planner__score route-planner__score--${meta.tone}`}>
          <span>{report.scoreAccesibilidad}</span>
          <small>/100</small>
        </div>
        <div className="route-planner__score-meta">
          <strong>
            {t('routes.accessibility')} {meta.label}
          </strong>
          <span>
            {(distanceMeters / 1000).toFixed(2)} km · {report.puntosControl.length} puntos
          </span>
        </div>
      </div>

      <div className="route-planner__risks">
        <span className="route-planner__chip route-planner__chip--alto">
          {counts.alto} {t('routes.riskHigh')}
        </span>
        <span className="route-planner__chip route-planner__chip--medio">
          {counts.medio} {t('routes.riskMed')}
        </span>
        <span className="route-planner__chip route-planner__chip--bajo">
          {counts.bajo} {t('routes.riskLow')}
        </span>
      </div>

      <p className="route-planner__resumen">{report.resumen}</p>

      {report.recomendaciones.length > 0 && (
        <details className="route-planner__reco-details">
          <summary>
            {t('routes.recommendations')} ({report.recomendaciones.length})
          </summary>
          <ul className="route-planner__reco">
            {report.recomendaciones.map((reco, index) => (
              <li key={index}>{reco}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

/** Ajusta el encuadre del mapa a la ruta calculada. */
function FitBounds({ positions }: { positions: [number, number][] | null }) {
  const map = useMap()
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

export function RoutePlanner() {
  const { t } = useAppSettings()
  const [origin, setOrigin] = useState<PlaceResult | null>(null)
  const [destination, setDestination] = useState<PlaceResult | null>(null)
  const [positions, setPositions] = useState<[number, number][] | null>(null)
  const [distanceMeters, setDistanceMeters] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [report, setReport] = useState<RouteAccessibilityReport | null>(null)

  // Calcula la ruta peatonal cuando hay origen y destino.
  useEffect(() => {
    if (!origin || !destination) return

    let cancelled = false
    setError(null)
    setReport(null)

    fetchWalkingRoute(origin, destination)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setPositions(null)
          setError(t('routes.routeError'))
          return
        }
        setPositions(result.positions)
        setDistanceMeters(result.distanceMeters)
      })
      .catch(() => {
        if (cancelled) return
        setPositions(null)
        setError('No se pudo calcular la ruta peatonal entre esos puntos.')
      })

    return () => {
      cancelled = true
    }
  }, [origin, destination])

  async function handleRouteAnalysis() {
    if (!positions) return

    const sampledPoints = pickEvenly(positions, MAX_AUDIT_POINTS).map(([lat, lng]) => ({
      lat,
      lng,
    }))

    setIsAnalyzing(true)
    setError(null)
    setReport(null)
    try {
      const result = await analyzeRouteAccessibility(sampledPoints, distanceMeters)
      setReport(result)
    } catch {
      setError(t('routes.aiError'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="route-planner">
      <div className="route-planner__panel">
        <p className="route-planner__title">{t('routes.title')}</p>

        <label className="route-planner__field">
          <span>{t('routes.origin')}</span>
          <PhotonAutocomplete placeholder={t('routes.originPh')} onSelect={setOrigin} />
        </label>

        <label className="route-planner__field">
          <span>{t('routes.destination')}</span>
          <PhotonAutocomplete placeholder={t('routes.destPh')} onSelect={setDestination} />
        </label>

        {error && <p className="route-planner__error">{error}</p>}

        {positions && (
          <button
            type="button"
            className="route-planner__analyze"
            onClick={() => void handleRouteAnalysis()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="route-planner__spinner" aria-hidden="true" />
                {t('routes.analyzing')}
              </>
            ) : (
              t('routes.analyze')
            )}
          </button>
        )}

        {report && <RouteReportCard report={report} distanceMeters={distanceMeters} />}
      </div>

      <MapContainer center={TIJUANA_CENTER} zoom={12} className="route-planner__map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={8}
            pathOptions={{ color: '#611232', fillColor: '#611232', fillOpacity: 1 }}
          />
        )}
        {destination && (
          <CircleMarker
            center={[destination.lat, destination.lng]}
            radius={8}
            pathOptions={{ color: '#9B2247', fillColor: '#9B2247', fillOpacity: 1 }}
          />
        )}
        {positions && (
          <Polyline positions={positions} pathOptions={{ color: '#9B2247', weight: 5, opacity: 0.9 }} />
        )}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  )
}
