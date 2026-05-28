import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { verifyUser } from "../middleware/auth";
import { requireRole, getUserRole } from "../middleware/roles";
import { Role } from "../types/Role";
import type { User } from "../types/User";

export const registerUserProfile = onCall(
  { maxInstances: 10 },
  async (request) => {
    await verifyUser(request);

    const { uid, displayName, email, photoURL, role } = request.data as {
      uid: string;
      displayName: string;
      email: string;
      photoURL?: string;
      role?: Role;
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

    const db = getDatabase();
    const userRef = db.ref(`users/${uid}`);
    const existingSnapshot = await userRef.once("value");

    const now = Date.now();

    if (existingSnapshot.exists()) {
      const existingUser = existingSnapshot.val() as User;

      if (existingUser.role !== targetRole) {
        const callerRole = getUserRole(request);

        if (callerRole === Role.CITIZEN && targetRole !== Role.CITIZEN) {
          throw new HttpsError(
            "permission-denied",
            "No tienes permisos para asignar este rol."
          );
        }
      }
    }

    await admin.auth().setCustomUserClaims(uid, { role: targetRole });

    const user: User = {
      uid,
      displayName,
      email,
      photoURL,
      role: targetRole,
      isActive: true,
      createdAt: existingSnapshot.exists()
        ? (existingSnapshot.val() as User).createdAt
        : now,
      lastLoginAt: now,
    };

    await userRef.set(user);

    logger.info("Usuario registrado", { uid, role: targetRole });

    return { success: true, user };
  }
);
