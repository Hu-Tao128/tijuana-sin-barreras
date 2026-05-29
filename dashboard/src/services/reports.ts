import { onValue, push, ref, remove, set, update } from 'firebase/database'
import { database } from './firebase'
import { ReportStatus, type BarrierType, type Report } from '../types'

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
