import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {verifyUser} from "../middleware/auth";

const ADMIN_FIELDS = [
  "role",
  "isActive",
  "reportCount",
  "verifiedReportCount",
  "createdAt",
  "lastLoginAt",
] as const;

function toTimestampMillis(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value &&
      typeof (value as {toMillis: () => unknown}).toMillis === "function") {
    return (value as {toMillis: () => number}).toMillis();
  }
  if (typeof value === "number") return value;
  return null;
}

export const getCurrentUserProfile = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    if (!request.auth) {
      return {success: false, error: "No autenticado"};
    }

    const uid = request.auth.uid;
    const db = getFirestore();

    const [authUser, firestoreDoc] = await Promise.all([
      admin.auth().getUser(uid),
      db.collection("users").doc(uid).get(),
    ]);

    if (!firestoreDoc.exists) {
      return {
        success: true,
        user: {
          uid,
          displayName: authUser.displayName ?? "",
          email: authUser.email ?? "",
          photoURL: authUser.photoURL,
          role: (authUser.customClaims?.role as string) ?? "citizen",
          isActive: true,
          reportCount: 0,
          verifiedReportCount: 0,
          fromFirestore: false,
        },
      };
    }

    const firestoreData = firestoreDoc.data() ?? {};

    const editableProfile: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(firestoreData)) {
      if (!ADMIN_FIELDS.includes(key as typeof ADMIN_FIELDS[number])) {
        editableProfile[key] = value;
      }
    }

    return {
      success: true,
      user: {
        uid,
        ...editableProfile,
        displayName: authUser.displayName ?? firestoreData.displayName ?? "",
        email: authUser.email ?? firestoreData.email ?? "",
        photoURL: authUser.photoURL ?? firestoreData.photoURL ?? null,
        phoneNumber: firestoreData.phoneNumber ?? authUser.phoneNumber ?? null,
        role: (authUser.customClaims?.role as string) ?? firestoreData.role ?? "citizen",
        isActive: firestoreData.isActive ?? true,
        reportCount: firestoreData.reportCount ?? 0,
        verifiedReportCount: firestoreData.verifiedReportCount ?? 0,
        createdAt: toTimestampMillis(firestoreData.createdAt),
        lastLoginAt: toTimestampMillis(firestoreData.lastLoginAt),
        fromFirestore: true,
      },
    };
  }
);
