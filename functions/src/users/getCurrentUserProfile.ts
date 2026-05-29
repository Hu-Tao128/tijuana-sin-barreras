import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {verifyUser} from "../middleware/auth";

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

    const firestoreData = firestoreDoc.exists ? firestoreDoc.data() ?? {} : {};

    return {
      success: true,
      user: {
        uid,
        displayName: authUser.displayName ?? firestoreData.displayName ?? "",
        email: authUser.email ?? firestoreData.email ?? "",
        photoURL: authUser.photoURL ?? firestoreData.photoURL ?? null,
        phoneNumber: firestoreData.phoneNumber ?? authUser.phoneNumber ?? null,
        emailVerified: authUser.emailVerified ?? false,
        disabled: authUser.disabled ?? false,
        role: (authUser.customClaims?.role as string) ?? firestoreData.role ?? "citizen",
        isActive: firestoreData.isActive ?? true,
        edad: firestoreData.edad ?? null,
        mobilityProfile: firestoreData.mobilityProfile ?? null,
        maxWalkingMeters: firestoreData.maxWalkingMeters ?? null,
        canClimbStairs: firestoreData.canClimbStairs ?? null,
        maxStairSteps: firestoreData.maxStairSteps ?? null,
        visionProfile: firestoreData.visionProfile ?? null,
        transportModes: firestoreData.transportModes ?? [],
        needsLowNoise: firestoreData.needsLowNoise ?? false,
        emergencyContact: firestoreData.emergencyContact ?? null,
        preferredLanguage: firestoreData.preferredLanguage ?? "es",
        reportCount: firestoreData.reportCount ?? 0,
        verifiedReportCount: firestoreData.verifiedReportCount ?? 0,
        createdAt: firestoreData.createdAt ?? null,
        lastLoginAt: firestoreData.lastLoginAt ?? null,
      },
    };
  }
);
