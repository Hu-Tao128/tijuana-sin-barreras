import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import * as functionsV1 from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import {Role} from "@tijuanasinbarreras/shared";
import {buildUserProfileSeed} from "./userProfileSeed";

export const onUserCreate = functionsV1
  .region("us-east1")
  .auth
  .user()
  .onCreate(async (user) => {
    const firestore = getFirestore();
    const userRef = firestore.collection("users").doc(user.uid);
    const existingSnapshot = await userRef.get();
    const existingData = existingSnapshot.data();
    const resolvedRole = (existingData?.role as Role | undefined) ??
      (user.customClaims?.role as Role | undefined) ??
      Role.CITIZEN;

    const profile = buildUserProfileSeed(
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
      },
      {
        ...existingData,
        role: resolvedRole,
      }
    );

    await userRef.set(profile, {merge: true});

    if (user.customClaims?.role !== resolvedRole) {
      await admin.auth().setCustomUserClaims(user.uid, {
        ...user.customClaims,
        role: resolvedRole,
      });
    }

    logger.info("Perfil base de usuario sincronizado desde Auth", {
      uid: user.uid,
      region: "us-east1",
      role: resolvedRole,
      existedInFirestore: existingSnapshot.exists,
    });
  });
