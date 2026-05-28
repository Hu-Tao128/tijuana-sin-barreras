import {onCall} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "../types/Role";

export const getUsers = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const db = getFirestore();
    const snapshot = await db.collection("users")
      .orderBy("displayName")
      .get();

    const users: Array<Record<string, unknown>> = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        phoneNumber: data.phoneNumber ?? null,
        photoURL: data.photoURL ?? null,
        edad: data.edad ?? null,
        role: data.role,
        isActive: data.isActive,
        mobilityProfile: data.mobilityProfile ?? null,
        maxWalkingMeters: data.maxWalkingMeters ?? null,
        canClimbStairs: data.canClimbStairs ?? null,
        maxStairSteps: data.maxStairSteps ?? null,
        visionProfile: data.visionProfile ?? null,
        transportModes: data.transportModes ?? [],
        needsLowNoise: data.needsLowNoise ?? false,
        emergencyContact: data.emergencyContact ?? null,
        preferredLanguage: data.preferredLanguage ?? "es",
        reportCount: data.reportCount ?? 0,
        verifiedReportCount: data.verifiedReportCount ?? 0,
        createdAt: data.createdAt?.toMillis?.() ?? null,
        lastLoginAt: data.lastLoginAt?.toMillis?.() ?? null,
      });
    });

    logger.info("Lista de usuarios obtenida", {count: users.length});

    return {users};
  }
);
