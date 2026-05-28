import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { verifyUser } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { Role } from "../types/Role";

export const setUserRole = onCall(
  { maxInstances: 10 },
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const { uid, role } = request.data as {
      uid: string;
      role: Role;
    };

    if (!uid || !role) {
      throw new HttpsError(
        "invalid-argument",
        "uid y role son requeridos."
      );
    }

    if (!Object.values(Role).includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Rol inválido. Valores permitidos: ${Object.values(Role).join(", ")}.`
      );
    }

    const db = getDatabase();
    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.once("value");

    if (!userSnapshot.exists()) {
      throw new HttpsError("not-found", "El usuario no existe en la base de datos.");
    }

    await admin.auth().setCustomUserClaims(uid, { role });

    await userRef.update({
      role,
      updatedAt: Date.now(),
    });

    logger.info("Rol de usuario actualizado", { uid, newRole: role });

    return { success: true, uid, role };
  }
);
