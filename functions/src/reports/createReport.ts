import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase, ServerValue} from "firebase-admin/database";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import {checkRateLimit} from "../middleware/ratelimit";
import {validateReport} from "../middleware/validation";
import {ReportStatus} from "../types/ReportStatus";
import {MobilityProfile} from "../types/MobilityProfile";
import {classifyBarrier} from "../gemini/classifyBarrier";
import {detectSpam} from "../gemini/detectSpam";
import type {Report} from "../types/Report";

function isValidStorageUrl(photoUrl?: string): boolean {
  if (!photoUrl) {
    return true;
  }

  return (
    photoUrl.startsWith("https://firebasestorage.googleapis.com/") ||
    photoUrl.startsWith("gs://")
  );
}

export const createReport = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    const userId = getUserId(request);

    await checkRateLimit(userId);

    const payload = request.data as Partial<Report> & {
      reporterMobilityProfile?: MobilityProfile;
    };

    validateReport(payload);

    if (!isValidStorageUrl(payload.photoUrl)) {
      throw new HttpsError(
        "invalid-argument",
        "La foto debe provenir de Firebase Storage."
      );
    }

    const firestore = getFirestore();
    const userDoc = await firestore.collection("users").doc(userId).get();

    const reporterMobilityProfile =
      payload.reporterMobilityProfile ??
      (userDoc.exists ? userDoc.data()?.mobilityProfile : undefined);

    const db = getDatabase();
    const reportsRef = db.ref("reports");
    const newReportRef = reportsRef.push();

    let type = payload.type;
    let severity = payload.severity ?? 5;
    let description = payload.description;

    if (payload.photoUrl) {
      const [spamResult, classification] = await Promise.all([
        detectSpam(payload.photoUrl),
        classifyBarrier(payload.photoUrl),
      ]);

      if (!spamResult.isBarrier || !classification.isBarrier) {
        throw new HttpsError(
          "failed-precondition",
          "La imagen no parece mostrar una barrera de accesibilidad válida."
        );
      }

      type = classification.type;
      severity = classification.severity;
      description = classification.description;
    }

    const now = Date.now();

    const report: Report = {
      id: newReportRef.key as string,
      userId,
      type,
      severity,
      description,
      photoUrl: payload.photoUrl,
      latitude: payload.latitude,
      longitude: payload.longitude,
      reporterMobilityProfile,
      verified: false,
      confirmations: 0,
      rejections: 0,
      status: ReportStatus.PENDING,
      createdAt: now,
    };

    await newReportRef.set(report);

    const analyticsRef = db.ref("analytics");
    await analyticsRef.child("totalReports").set(ServerValue.increment(1));
    await analyticsRef
      .child("reportsByType")
      .child(report.type)
      .set(ServerValue.increment(1));

    await firestore.collection("users").doc(userId).update({
      reportCount: FieldValue.increment(1),
    });

    logger.info("Reporte creado", {
      reportId: report.id,
      userId,
      type: report.type,
      reporterMobilityProfile,
    });

    return {success: true, report};
  }
);
