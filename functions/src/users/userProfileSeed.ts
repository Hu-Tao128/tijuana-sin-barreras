import {Timestamp} from "firebase-admin/firestore";
import {Language} from "../types/Language";
import {Role} from "../types/Role";

type AuthUserSeedInput = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
};

type ExistingUserSeed = Partial<{
  role: Role;
  isActive: boolean;
  mobilityProfile: string | null;
  maxWalkingMeters: number | null;
  canClimbStairs: boolean | null;
  maxStairSteps: number | null;
  visionProfile: string | null;
  transportModes: string[];
  needsLowNoise: boolean;
  emergencyContact: {name: string; phone: string} | null;
  preferredLanguage: Language;
  reportCount: number;
  verifiedReportCount: number;
  edad: number | null;
  createdAt: Timestamp;
}>;

export function resolveDisplayName(
  displayName?: string | null,
  email?: string | null
): string {
  if (displayName?.trim()) {
    return displayName.trim();
  }

  if (email?.includes("@")) {
    return email.split("@")[0];
  }

  return "Usuario";
}

export function buildUserProfileSeed(
  authUser: AuthUserSeedInput,
  existingUser: ExistingUserSeed = {},
  nowMs = Date.now()
) {
  const now = Timestamp.fromMillis(nowMs);
  const role = existingUser.role ?? Role.CITIZEN;

  return {
    uid: authUser.uid,
    displayName: resolveDisplayName(authUser.displayName, authUser.email),
    email: authUser.email ?? "",
    phoneNumber: authUser.phoneNumber ?? null,
    photoURL: authUser.photoURL ?? null,
    edad: existingUser.edad ?? null,
    role,
    isActive: existingUser.isActive ?? true,
    mobilityProfile: existingUser.mobilityProfile ?? null,
    maxWalkingMeters: existingUser.maxWalkingMeters ?? null,
    canClimbStairs: existingUser.canClimbStairs ?? null,
    maxStairSteps: existingUser.maxStairSteps ?? null,
    visionProfile: existingUser.visionProfile ?? null,
    transportModes: existingUser.transportModes ?? [],
    needsLowNoise: existingUser.needsLowNoise ?? false,
    emergencyContact: existingUser.emergencyContact ?? null,
    preferredLanguage: existingUser.preferredLanguage ?? Language.ES,
    reportCount: existingUser.reportCount ?? 0,
    verifiedReportCount: existingUser.verifiedReportCount ?? 0,
    createdAt: existingUser.createdAt ?? now,
    lastLoginAt: now,
  };
}
