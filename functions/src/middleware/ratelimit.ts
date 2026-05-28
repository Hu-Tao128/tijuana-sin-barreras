import {getDatabase} from "firebase-admin/database";
import {HttpsError} from "firebase-functions/v2/https";

const MAX_REPORTS_PER_DAY = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function checkRateLimit(uid: string): Promise<void> {
  const db = getDatabase();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const reportsRef = db.ref("reports");
  const snapshot = await reportsRef
    .orderByChild("userId")
    .equalTo(uid)
    .once("value");

  let recentCount = 0;

  snapshot.forEach((child) => {
    const report = child.val();
    if (report.createdAt >= windowStart) {
      recentCount++;
    }
  });

  if (recentCount >= MAX_REPORTS_PER_DAY) {
    throw new HttpsError(
      "resource-exhausted",
      `Has excedido el límite de ${MAX_REPORTS_PER_DAY} reportes por día.`
    );
  }
}
