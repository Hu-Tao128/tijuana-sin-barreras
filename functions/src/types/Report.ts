import {BarrierType} from "./BarrierType";
import {ReportStatus} from "./ReportStatus";
import {MobilityProfile} from "./MobilityProfile";

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
}
