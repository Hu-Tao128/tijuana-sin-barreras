import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "../types/Role";
import {Timestamp} from "firebase-admin/firestore";

export const setUserRole = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const {uid, role} = request.data as {
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
        `Rol inválido. Valores: ${Object.values(Role).join(", ")}.`
      );
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError(
        "not-found",
        "El usuario no existe en Firestore."
      );
    }

    await admin.auth().setCustomUserClaims(uid, {role});

    await userRef.update({
      role,
      lastLoginAt: Timestamp.fromMillis(Date.now()),
    });

    logger.info("Rol de usuario actualizado", {uid, newRole: role});

    return {success: true, uid, role};
  }
);
