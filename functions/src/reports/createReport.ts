import {onCall} from "firebase-functions/v2/https";
import {getDatabase, ServerValue} from "firebase-admin/database";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import {checkRateLimit} from "../middleware/ratelimit";
import {validateReport} from "../middleware/validation";
import {encode as encodeGeohash} from "../middleware/geohash";
import {MobilityProfile, ReportStatus} from "@tijuanasinbarreras/shared";
import type {Report} from "@tijuanasinbarreras/shared";

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

    const firestore = getFirestore();
    const userDoc = await firestore.collection("users").doc(userId).get();

    const reporterMobilityProfile =
      payload.reporterMobilityProfile ??
      (userDoc.exists ? userDoc.data()?.mobilityProfile : undefined);

    const db = getDatabase();
    const reportsRef = db.ref("reports");
    const newReportRef = reportsRef.push();

    const now = Date.now();

    const report: Report = {
      id: newReportRef.key as string,
      userId,
      type: payload.type,
      severity: payload.severity ?? 5,
      description: payload.description || "",
      photoUrl: payload.photoUrl || "",
      latitude: payload.latitude,
      longitude: payload.longitude,
      geohash: encodeGeohash(payload.latitude, payload.longitude),
      reporterMobilityProfile,
      verified: false,
      confirmations: 0,
      rejections: 0,
      status: ReportStatus.PENDING,
      createdAt: now,
    };

    // RTDB doesn't allow undefined values. We use empty strings or remove properties.
    // Given the Report interface expects these fields, empty strings are safer if the interface allows it.
    // However, if the interface says they are optional, we should delete them.
    const cleanReport = JSON.parse(JSON.stringify(report));

    await newReportRef.set(cleanReport);

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
