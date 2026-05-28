import { HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";

export function verifyUser(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }
}

export function getUserId(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }

  return request.auth.uid;
}
