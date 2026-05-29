import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "../types/Role";
import {ReportStatus} from "../types/ReportStatus";
import type {ArchiveReason, Report} from "../types/Report";

const VALID_ARCHIVE_REASONS: readonly ArchiveReason[] = [
  "fixed",
  "duplicate",
  "invalid",
  "other",
];

export const archiveReport = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const {reportId, archiveReason, reason} = request.data as {
      reportId: string;
      archiveReason?: string;
      reason?: string;
    };

    if (!reportId) {
      throw new HttpsError(
        "invalid-argument",
        "reportId es requerido."
      );
    }

    const requestedReason = archiveReason ?? reason;
    const resolvedReason = requestedReason &&
      VALID_ARCHIVE_REASONS.includes(requestedReason as ArchiveReason) ?
      (requestedReason as ArchiveReason) :
      "other";

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
      archiveReason: resolvedReason,
      resolvedAt: resolvedReason === "fixed" ? now : null,
    });

    logger.info("Reporte archivado", {
      reportId,
      previousStatus: report.status,
      archiveReason: resolvedReason,
    });

    return {
      success: true,
      report: {
        ...report,
        status: ReportStatus.ARCHIVED,
        updatedAt: now,
        archiveReason: resolvedReason,
        resolvedAt: resolvedReason === "fixed" ? now : undefined,
      },
    };
  }
);
