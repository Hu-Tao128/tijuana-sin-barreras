import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {auth} from "firebase-functions/v1";
import {Language, Role} from "@tijuanasinbarreras/shared";

export const onUserCreate = auth.user().onCreate(async (user) => {
  const db = getFirestore();
  const now = Date.now();
  const userRef = db.collection("users").doc(user.uid);
  const existingDoc = await userRef.get();

  if (existingDoc.exists) {
    logger.info("Documento Firestore ya existe para el usuario, omitiendo creación", {
      uid: user.uid,
    });
    return;
  }

  await userRef.set({
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? null,
    photoURL: user.photoURL ?? null,
    emailVerified: user.emailVerified ?? false,
    disabled: user.disabled ?? false,
    edad: null,
    role: Role.CITIZEN,
    isActive: true,
    mobilityProfile: null,
    maxWalkingMeters: null,
    canClimbStairs: null,
    maxStairSteps: null,
    visionProfile: null,
    transportModes: [],
    needsLowNoise: false,
    emergencyContact: null,
    preferredLanguage: Language.ES,
    reportCount: 0,
    verifiedReportCount: 0,
    createdAt: Timestamp.fromMillis(now),
    lastLoginAt: Timestamp.fromMillis(now),
  });

  await admin.auth().setCustomUserClaims(user.uid, {role: Role.CITIZEN});

  logger.info("Perfil creado automáticamente en Firestore via auth trigger", {
    uid: user.uid,
    email: user.email,
    provider: user.providerData?.[0]?.providerId ?? "email",
  });
});
