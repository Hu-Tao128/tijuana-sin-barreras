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

    const [authUser, firestore] = await Promise.all([
      admin.auth().getUser(uid),
      Promise.resolve(getFirestore()),
    ]);

    const userDoc = await firestore.collection("users").doc(uid).get();

    if (!userDoc.exists) {
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

    const data = userDoc.data() ?? {};

    const editableProfile: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!ADMIN_FIELDS.includes(key as typeof ADMIN_FIELDS[number])) {
        editableProfile[key] = value;
      }
    }

    return {
      success: true,
      user: {
        uid,
        ...editableProfile,
        displayName: authUser.displayName ?? data.displayName ?? "",
        email: authUser.email ?? data.email ?? "",
        photoURL: authUser.photoURL ?? data.photoURL ?? null,
        role: (authUser.customClaims?.role as string) ?? data.role ?? "citizen",
        isActive: data.isActive ?? true,
        reportCount: data.reportCount ?? 0,
        verifiedReportCount: data.verifiedReportCount ?? 0,
        createdAt: toTimestampMillis(data.createdAt),
        lastLoginAt: toTimestampMillis(data.lastLoginAt),
        fromFirestore: true,
      },
    };
  }
);
