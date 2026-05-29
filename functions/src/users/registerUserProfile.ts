import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {Language, MobilityProfile, Role, VisionProfile} from "@tijuanasinbarreras/shared";

const EDITABLE_FIELDS = [
  "displayName",
  "phoneNumber",
  "photoURL",
  "edad",
  "mobilityProfile",
  "maxWalkingMeters",
  "canClimbStairs",
  "maxStairSteps",
  "visionProfile",
  "transportModes",
  "needsLowNoise",
  "emergencyContact",
  "preferredLanguage",
] as const;

function extractEditableFields(data: Record<string, unknown>): Record<string, unknown> {
  const editable: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in data && data[field] !== undefined) {
      editable[field] = data[field];
    }
  }
  return editable;
}

export const registerUserProfile = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado.");
    }

    const uid = request.auth.uid;

    const {
      displayName,
      email,
      phoneNumber,
      photoURL,
      edad,
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
      displayName?: string;
      email?: string;
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

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const existingDoc = await userRef.get();

    const authUser = await admin.auth().getUser(uid);

    const editableData = extractEditableFields(request.data as Record<string, unknown>);

    if (existingDoc.exists) {
      const updateData: Record<string, unknown> = {
        ...editableData,
        email: email ?? authUser.email ?? existingDoc.data()?.email ?? "",
        displayName: displayName ?? authUser.displayName ?? existingDoc.data()?.displayName ?? "",
        photoURL: photoURL ?? authUser.photoURL ?? existingDoc.data()?.photoURL ?? null,
        lastLoginAt: Timestamp.fromMillis(Date.now()),
      };

      if (displayName) {
        try {
          await admin.auth().updateUser(uid, {displayName});
        } catch {
          logger.warn("No se pudo actualizar displayName en Auth", {uid});
        }
      }

      await userRef.update(updateData);

      logger.info("Perfil de usuario actualizado", {uid});

      const updatedDoc = await userRef.get();
      const fullData = updatedDoc.data() ?? {};

      return {
        success: true,
        user: {
          uid,
          ...fullData,
          createdAt: fullData.createdAt?.toMillis?.() ?? fullData.createdAt,
          lastLoginAt: fullData.lastLoginAt?.toMillis?.() ?? fullData.lastLoginAt,
        },
      };
    }

    const now = Date.now();

    const profile = {
      uid,
      displayName: displayName ?? authUser.displayName ?? "",
      email: email ?? authUser.email ?? "",
      phoneNumber: phoneNumber ?? null,
      photoURL: photoURL ?? authUser.photoURL ?? null,
      edad: edad ?? null,
      role: Role.CITIZEN,
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
      reportCount: 0,
      verifiedReportCount: 0,
      createdAt: Timestamp.fromMillis(now),
      lastLoginAt: Timestamp.fromMillis(now),
    };

    await userRef.set(profile);
    await admin.auth().setCustomUserClaims(uid, {role: Role.CITIZEN});

    logger.info("Usuario registrado en Firestore", {uid, role: Role.CITIZEN});

    return {
      success: true,
      user: {
        ...profile,
        createdAt: now,
        lastLoginAt: now,
      },
    };
  }
);
