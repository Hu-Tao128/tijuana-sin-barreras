import {BarrierType} from "./BarrierType.js";
import {ReportStatus} from "./ReportStatus.js";

export const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  [BarrierType.BROKEN_SIDEWALK]: "Banqueta dañada",
  [BarrierType.BLOCKED_RAMP]: "Rampa bloqueada",
  [BarrierType.NO_SIDEWALK]: "Sin banqueta",
  [BarrierType.CONSTRUCTION]: "Construcción",
  [BarrierType.OBSTACLE]: "Obstáculo",
  [BarrierType.DANGEROUS_CROSSING]: "Cruce peligroso",
  [BarrierType.OTHER]: "Otro",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "Pendiente",
  [ReportStatus.VERIFIED]: "Verificado",
  [ReportStatus.REJECTED]: "Rechazado",
  [ReportStatus.ARCHIVED]: "Archivado",
};
