import {onCall} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "../types/Role";

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  edad?: number;
  role: string;
  isActive: boolean;
  usaSillaDeRuedas?: boolean;
  usaBaston?: boolean;
  problemasVision?: boolean;
  necesitaPerroGuia?: boolean;
  necesitaGuia?: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  lastLoginAt?: FirebaseFirestore.Timestamp;
}

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
      const data = doc.data() as UserData;
      users.push({
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        phoneNumber: data.phoneNumber ?? null,
        photoURL: data.photoURL ?? null,
        edad: data.edad ?? null,
        role: data.role,
        isActive: data.isActive,
        usaSillaDeRuedas: data.usaSillaDeRuedas ?? false,
        usaBaston: data.usaBaston ?? false,
        problemasVision: data.problemasVision ?? false,
        necesitaPerroGuia: data.necesitaPerroGuia ?? false,
        necesitaGuia: data.necesitaGuia ?? false,
        createdAt: data.createdAt?.toMillis?.() ?? null,
        lastLoginAt: data.lastLoginAt?.toMillis?.() ?? null,
      });
    });

    logger.info("Lista de usuarios obtenida", {count: users.length});

    return {users};
  }
);
