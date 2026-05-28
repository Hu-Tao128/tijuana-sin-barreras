import {HttpsError, CallableRequest} from "firebase-functions/v2/https";
import {Role} from "../types/Role";

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.CITIZEN]: 1,
  [Role.MODERATOR]: 2,
  [Role.OFFICIAL]: 3,
};

export async function requireRole(
  request: CallableRequest,
  requiredRole: Role
): Promise<void> {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }

  const userRole = request.auth.token.role as Role | undefined;

  if (!userRole) {
    throw new HttpsError(
      "permission-denied",
      "El usuario no tiene un rol asignado."
    );
  }

  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

  if (userLevel < requiredLevel) {
    throw new HttpsError(
      "permission-denied",
      `Se requiere rol mínimo: ${requiredRole}.`
    );
  }
}

export function getUserRole(request: CallableRequest): Role {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "El usuario debe estar autenticado."
    );
  }

  return (request.auth.token.role as Role) ?? Role.CITIZEN;
}
