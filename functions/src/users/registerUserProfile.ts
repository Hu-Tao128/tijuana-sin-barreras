import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole, getUserRole} from "../middleware/roles";
import {Language, MobilityProfile, Role, VisionProfile} from "@tijuanasinbarreras/shared";

export const registerUserProfile = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    const {
      uid,
      displayName,
      email,
      phoneNumber,
      photoURL,
      edad,
      role,
      mobilityProfile,
      maxWalkingMeters,
      canClimbStairs,
      maxStairSteps,
      visionProfile,
      transportModes,
      needsLowNoise,
      emergencyContact,
      preferredLanguage,
    } = request.data as {
      uid: string;
      displayName: string;
      email: string;
      phoneNumber?: string;
      photoURL?: string;
      edad?: number;
      role?: Role;
      mobilityProfile?: MobilityProfile;
      maxWalkingMeters?: number;
      canClimbStairs?: boolean;
      maxStairSteps?: number;
      visionProfile?: VisionProfile;
      transportModes?: string[];
      needsLowNoise?: boolean;
      emergencyContact?: {name: string; phone: string};
      preferredLanguage?: Language;
    };

    if (!uid || !displayName || !email) {
      throw new HttpsError(
        "invalid-argument",
        "uid, displayName y email son requeridos."
      );
    }

    const targetRole = role ?? Role.CITIZEN;

    if (targetRole !== Role.CITIZEN) {
      await requireRole(request, Role.MODERATOR);
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const existingDoc = await userRef.get();

    const now = Date.now();

    if (existingDoc.exists) {
      const existingData = existingDoc.data() ?? {};

      if (existingData.role !== targetRole) {
        const callerRole = getUserRole(request);

        if (callerRole === Role.CITIZEN && targetRole !== Role.CITIZEN) {
          throw new HttpsError(
            "permission-denied",
            "No tienes permisos para asignar este rol."
          );
        }
      }
    }

    await admin.auth().setCustomUserClaims(uid, {role: targetRole});

    const existingCounts = existingDoc.exists ? {
      reportCount: existingDoc.data()?.reportCount ?? 0,
      verifiedReportCount: existingDoc.data()?.verifiedReportCount ?? 0,
    } : {reportCount: 0, verifiedReportCount: 0};

    await userRef.set({
      uid,
      displayName,
      email,
      phoneNumber: phoneNumber ?? null,
      photoURL: photoURL ?? null,
      edad: edad ?? null,
      role: targetRole,
      isActive: true,
      mobilityProfile: mobilityProfile ?? null,
      maxWalkingMeters: maxWalkingMeters ?? null,
      canClimbStairs: canClimbStairs ?? null,
      maxStairSteps: maxStairSteps ?? null,
      visionProfile: visionProfile ?? null,
      transportModes: transportModes ?? [],
      needsLowNoise: needsLowNoise ?? false,
      emergencyContact: emergencyContact ?? null,
      preferredLanguage: preferredLanguage ?? Language.ES,
      reportCount: existingCounts.reportCount,
      verifiedReportCount: existingCounts.verifiedReportCount,
      createdAt: existingDoc.exists ?
        (existingDoc.data() ?? {}).createdAt :
        Timestamp.fromMillis(now),
      lastLoginAt: Timestamp.fromMillis(now),
    });

    logger.info("Usuario registrado en Firestore", {uid, role: targetRole});

    return {
      success: true,
      user: {uid, displayName, email, role: targetRole},
    };
  }
);
