import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {verifyUser} from "../middleware/auth";

export const getCurrentUserProfile = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    if (!request.auth) {
      return {success: false, error: "No autenticado"};
    }

    const uid = request.auth.uid;

    const authUser = await admin.auth().getUser(uid);

    return {
      success: true,
      user: {
        uid,
        displayName: authUser.displayName ?? "",
        email: authUser.email ?? "",
        photoURL: authUser.photoURL,
        role: (authUser.customClaims?.role as string) ?? "citizen",
      },
    };
  }
);
