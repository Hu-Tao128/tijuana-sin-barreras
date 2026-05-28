import { onCall } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import { verifyUser } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { Role } from "../types/Role";
import type { User } from "../types/User";

export const getUsers = onCall(
  { maxInstances: 5 },
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const db = getDatabase();
    const usersSnapshot = await db.ref("users").once("value");

    const users: User[] = [];

    usersSnapshot.forEach((child) => {
      users.push(child.val() as User);
    });

    const sorted = users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    logger.info("Lista de usuarios obtenida", { count: sorted.length });

    return { users: sorted };
  }
);
