import {Role} from "./Role.js";
import {MobilityProfile} from "./MobilityProfile.js";
import {VisionProfile} from "./VisionProfile.js";
import {Language} from "./Language.js";

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface User {
  uid: string;

  displayName: string;

  email: string;

  phoneNumber?: string;

  photoURL?: string;

  edad?: number;

  role: Role;

  isActive: boolean;

  mobilityProfile?: MobilityProfile;

  maxWalkingMeters?: number;

  canClimbStairs?: boolean;

  maxStairSteps?: number;

  visionProfile?: VisionProfile;

  transportModes?: string[];

  needsLowNoise?: boolean;

  emergencyContact?: EmergencyContact;

  preferredLanguage?: Language;

  reportCount: number;

  verifiedReportCount: number;

  createdAt: number;

  lastLoginAt?: number;
}
