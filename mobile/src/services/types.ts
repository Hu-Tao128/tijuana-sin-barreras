export const BarrierType = {
  BROKEN_SIDEWALK: 'broken_sidewalk',
  BLOCKED_RAMP: 'blocked_ramp',
  NO_SIDEWALK: 'no_sidewalk',
  CONSTRUCTION: 'construction',
  OBSTACLE: 'obstacle',
  DANGEROUS_CROSSING: 'dangerous_crossing',
  OTHER: 'other',
} as const;
export type BarrierType = (typeof BarrierType)[keyof typeof BarrierType];

export const ReportStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const MobilityProfile = {
  WHEELCHAIR_ELECTRIC: 'wheelchair_electric',
  WHEELCHAIR_MANUAL: 'wheelchair_manual',
  WALKER: 'walker',
  CANE: 'cane',
  AMBULATORY_LIMITED: 'ambulatory_limited',
  AMBULATORY: 'ambulatory',
} as const;
export type MobilityProfile = (typeof MobilityProfile)[keyof typeof MobilityProfile];

export const VisionProfile = {
  NORMAL: 'normal',
  LOW_VISION: 'low_vision',
  BLIND: 'blind',
} as const;
export type VisionProfile = (typeof VisionProfile)[keyof typeof VisionProfile];

export const Language = {
  ES: 'es',
  EN: 'en',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const Role = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  OFFICIAL: 'official',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export interface Report {
  id: string;
  userId: string;
  type: BarrierType;
  severity: number;
  description?: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  reporterMobilityProfile?: MobilityProfile;
  verified: boolean;
  confirmations: number;
  rejections: number;
  status: ReportStatus;
  createdAt: number;
  updatedAt?: number;
  archiveReason?: string;
  geohash?: string;
  resolvedAt?: number;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Confirmation {
  id: string;
  reportId: string;
  userId: string;
  isConfirmed: boolean;
  createdAt: number;
}

export const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  [BarrierType.BROKEN_SIDEWALK]: 'Banqueta dañada',
  [BarrierType.BLOCKED_RAMP]: 'Rampa bloqueada',
  [BarrierType.NO_SIDEWALK]: 'Sin banqueta',
  [BarrierType.CONSTRUCTION]: 'Construcción',
  [BarrierType.OBSTACLE]: 'Obstáculo',
  [BarrierType.DANGEROUS_CROSSING]: 'Cruce peligroso',
  [BarrierType.OTHER]: 'Otro',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: 'Pendiente',
  [ReportStatus.VERIFIED]: 'Verificado',
  [ReportStatus.REJECTED]: 'Rechazado',
  [ReportStatus.ARCHIVED]: 'Archivado',
};

export const REPORT_CATEGORIES: {
  id: BarrierType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: BarrierType.BROKEN_SIDEWALK, label: 'Banqueta dañada', icon: '🛠️', color: '#ef4444' },
  { id: BarrierType.BLOCKED_RAMP, label: 'Rampa bloqueada', icon: '♿', color: '#ef4444' },
  { id: BarrierType.NO_SIDEWALK, label: 'Sin banqueta', icon: '🚫', color: '#ef4444' },
  { id: BarrierType.CONSTRUCTION, label: 'Obra/Construcción', icon: '🚧', color: '#f59e0b' },
  { id: BarrierType.OBSTACLE, label: 'Obstáculo en vía', icon: '📦', color: '#f59e0b' },
  { id: BarrierType.DANGEROUS_CROSSING, label: 'Cruce peligroso', icon: '⚠️', color: '#ef4444' },
  { id: BarrierType.OTHER, label: 'Otro tipo', icon: '📋', color: '#6b7280' },
];

export const SEVERITY_LEVELS = [
  { value: 3, label: 'Baja', color: '#fbbf24' },
  { value: 5, label: 'Media', color: '#f59e0b' },
  { value: 8, label: 'Alta', color: '#ef4444' },
  { value: 10, label: 'Crítica', color: '#991b1b' },
];
