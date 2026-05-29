import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role, ReportStatus} from "@tijuanasinbarreras/shared";
import type {Report} from "@tijuanasinbarreras/shared";

export const archiveReport = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const {reportId} = request.data as { reportId: string };

    if (!reportId) {
      throw new HttpsError(
        "invalid-argument",
        "reportId es requerido."
      );
    }

    const db = getDatabase();
    const reportRef = db.ref(`reports/${reportId}`);
    const reportSnapshot = await reportRef.once("value");

    if (!reportSnapshot.exists()) {
      throw new HttpsError("not-found", "El reporte no existe.");
    }

    const report = reportSnapshot.val() as Report;
    const now = Date.now();

    await reportRef.update({
      status: ReportStatus.ARCHIVED,
      updatedAt: now,
    });

    logger.info("Reporte archivado", {
      reportId,
      previousStatus: report.status,
    });

    return {
      success: true,
      report: {...report, status: ReportStatus.ARCHIVED, updatedAt: now},
    };
  }
);
