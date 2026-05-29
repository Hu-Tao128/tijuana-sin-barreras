export const Role = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  OFFICIAL: 'official',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const BarrierType = {
  BROKEN_SIDEWALK: 'broken_sidewalk',
  BLOCKED_RAMP: 'blocked_ramp',
  NO_SIDEWALK: 'no_sidewalk',
  CONSTRUCTION: 'construction',
  OBSTACLE: 'obstacle',
  DANGEROUS_CROSSING: 'dangerous_crossing',
  OTHER: 'other',
} as const
export type BarrierType = (typeof BarrierType)[keyof typeof BarrierType]

export const ReportStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export interface Report {
  id: string
  userId: string
  type: BarrierType
  severity: number
  description?: string
  photoUrl?: string
  latitude: number
  longitude: number
  verified: boolean
  confirmations: number
  rejections: number
  status: ReportStatus
  createdAt: number
  updatedAt?: number
}

export interface Confirmation {
  id: string
  reportId: string
  userId: string
  isConfirmed: boolean
  createdAt: number
}

export interface DashboardStats {
  totalReports: number
  verifiedReports: number
  pendingReports: number
  rejectedReports: number
  archivedReports: number
  totalUsers: number
  reportsByType: Record<string, number>
  recentReports: Report[]
}

export interface HeatmapZone {
  zone: string
  count: number
}

export const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  [BarrierType.BROKEN_SIDEWALK]: 'Banqueta dañada',
  [BarrierType.BLOCKED_RAMP]: 'Rampa bloqueada',
  [BarrierType.NO_SIDEWALK]: 'Sin banqueta',
  [BarrierType.CONSTRUCTION]: 'Construcción',
  [BarrierType.OBSTACLE]: 'Obstáculo',
  [BarrierType.DANGEROUS_CROSSING]: 'Cruce peligroso',
  [BarrierType.OTHER]: 'Otro',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: 'Pendiente',
  [ReportStatus.VERIFIED]: 'Verificado',
  [ReportStatus.REJECTED]: 'Rechazado',
  [ReportStatus.ARCHIVED]: 'Archivado',
}
