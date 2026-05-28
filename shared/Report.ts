import { BarrierType } from "./BarrierType";
import { ReportStatus } from "./ReportStatus";

export interface Report {
  id: string;

  userId: string;

  type: BarrierType;

  severity: number;

  description?: string;

  photoUrl?: string;

  latitude: number;

  longitude: number;

  verified: boolean;

  confirmations: number;

  rejections: number;

  status: ReportStatus;

  createdAt: number;

  updatedAt?: number;
}
