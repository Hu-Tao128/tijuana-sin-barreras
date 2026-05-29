import {BarrierType} from "./BarrierType.js";
import {ReportStatus} from "./ReportStatus.js";
import {MobilityProfile} from "./MobilityProfile.js";

export type ArchiveReason = "fixed" | "duplicate" | "invalid" | "other";

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

  archiveReason?: ArchiveReason;

  geohash?: string;

  resolvedAt?: number;
}
