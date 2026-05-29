import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { database } from './firebase'
import { BarrierType, ReportStatus, type Report } from '../types'

const REPORTS_PATH = 'reports'

/**
 * Suscripción en tiempo real a la lista de reportes en Realtime Database.
 * Devuelve la función para cancelar la suscripción.
 */
export function subscribeToReports(
  onData: (reports: Report[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const reportsRef = ref(database, REPORTS_PATH)
  return onValue(
    reportsRef,
    (snapshot) => {
      const value = snapshot.val() as Record<string, Report> | null
      const list = value ? Object.values(value) : []
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      onData(list)
    },
    (error) => onError?.(error),
  )
}

export type NewReportInput = {
  userId: string
  type: BarrierType
  severity: number
  description?: string
  latitude: number
  longitude: number
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const reportsRef = ref(database, REPORTS_PATH)
  const newRef = push(reportsRef)

  const report: Report = {
    id: newRef.key as string,
    userId: input.userId,
    type: input.type,
    severity: input.severity,
    latitude: input.latitude,
    longitude: input.longitude,
    verified: false,
    confirmations: 0,
    rejections: 0,
    status: ReportStatus.PENDING,
    createdAt: Date.now(),
  }

  // RTDB no acepta `undefined`; solo agregamos descripción si existe.
  if (input.description && input.description.trim()) {
    report.description = input.description.trim()
  }

  await set(newRef, report)
  return report
}

export async function deleteReport(reportId: string): Promise<void> {
  await remove(ref(database, `${REPORTS_PATH}/${reportId}`))
}

export async function setReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  await update(ref(database, `${REPORTS_PATH}/${reportId}`), {
    status,
    verified: status === ReportStatus.VERIFIED,
    updatedAt: Date.now(),
  })
}

/** Puntos repartidos por Tijuana para datos de demostración. */
const TIJUANA_DEMO_POINTS: Array<{ lat: number; lng: number; label: string }> = [
  { lat: 32.5342, lng: -117.0382, label: 'Centro' },
  { lat: 32.5289, lng: -117.0198, label: 'Zona Río' },
  { lat: 32.5155, lng: -117.0375, label: 'Cecut' },
  { lat: 32.5098, lng: -117.0652, label: 'La Mesa' },
  { lat: 32.4982, lng: -117.0431, label: 'Hipódromo' },
  { lat: 32.4876, lng: -117.0284, label: 'Buena Vista' },
  { lat: 32.4765, lng: -117.0543, label: 'Camino Verde' },
  { lat: 32.4689, lng: -117.0812, label: 'Otay' },
  { lat: 32.4551, lng: -117.0658, label: 'Industrial Otay' },
  { lat: 32.4423, lng: -117.0389, label: 'El Refugio' },
  { lat: 32.5214, lng: -117.1123, label: 'Playas' },
  { lat: 32.5087, lng: -117.0984, label: 'Playas Sección Jardines' },
  { lat: 32.5412, lng: -117.0612, label: 'Río' },
  { lat: 32.5523, lng: -117.0891, label: 'Libertad' },
  { lat: 32.5198, lng: -117.0045, label: 'Agua Caliente' },
  { lat: 32.5312, lng: -117.0521, label: 'Chapultepec' },
  { lat: 32.5045, lng: -117.0198, label: 'Pasaje Simón' },
  { lat: 32.4923, lng: -117.0712, label: 'Sánchez Taboada' },
  { lat: 32.4612, lng: -117.0312, label: 'Villa Fontana' },
  { lat: 32.5189, lng: -117.0889, label: 'Emperadores' },
]

const DEMO_DESCRIPTIONS = [
  'Banqueta con grietas profundas',
  'Rampa bloqueada por vehículo',
  'Sin banqueta en tramo de 50 m',
  'Obstáculo en paso peatonal',
  'Cruce sin señalización accesible',
  'Construcción sin paso alterno',
  'Desnivel peligroso en rampa',
  'Poste en medio de banqueta',
]

/**
 * Inserta reportes de ejemplo en Tijuana para poblar gráficas y mapa de calor.
 */
export async function seedDemoReports(userId = 'demo-seed'): Promise<number> {
  const types = Object.values(BarrierType) as BarrierType[]
  const statuses = [
    ReportStatus.PENDING,
    ReportStatus.VERIFIED,
    ReportStatus.REJECTED,
    ReportStatus.ARCHIVED,
  ] as const

  const reportsRef = ref(database, REPORTS_PATH)
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const writes = Array.from({ length: 60 }, (_, i) => {
    const point = TIJUANA_DEMO_POINTS[i % TIJUANA_DEMO_POINTS.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const createdAt = now - Math.floor(Math.random() * 150) * day - Math.floor(Math.random() * day)
    const newRef = push(reportsRef)

    const report: Report = {
      id: newRef.key as string,
      userId,
      type: types[Math.floor(Math.random() * types.length)],
      severity: Math.floor(Math.random() * 10) + 1,
      description: `${DEMO_DESCRIPTIONS[i % DEMO_DESCRIPTIONS.length]} · ${point.label}`,
      latitude: point.lat + (Math.random() - 0.5) * 0.012,
      longitude: point.lng + (Math.random() - 0.5) * 0.012,
      verified: status === ReportStatus.VERIFIED,
      confirmations: status === ReportStatus.VERIFIED ? 2 : 0,
      rejections: status === ReportStatus.REJECTED ? 1 : 0,
      status,
      createdAt,
    }

    if (status !== ReportStatus.PENDING) {
      report.updatedAt = createdAt + 3_600_000
    }

    return set(newRef, report)
  })

  await Promise.all(writes)
  return writes.length
}
