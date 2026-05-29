import {onValueWritten} from "firebase-functions/v2/database";
import {getDatabase, ServerValue} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {ReportStatus} from "@tijuanasinbarreras/shared";

interface ReportData {
  status?: string;
}

export const updateStatistics = onValueWritten(
  {
    ref: "reports/{reportId}",
    maxInstances: 5,
    region: "us-central1",
  },
  async (event) => {
    const db = getDatabase();
    const {reportId} = event.params;

    const beforeSnapshot = event.data.before;
    const afterSnapshot = event.data.after;

    const beforeData = beforeSnapshot.exists() ?
      (beforeSnapshot.val() as ReportData) :
      null;
    const afterData = afterSnapshot.exists() ?
      (afterSnapshot.val() as ReportData) :
      null;

    const analyticsRef = db.ref("analytics");

    if (!afterData && beforeData) {
      await analyticsRef.child("totalReports").set(ServerValue.increment(-1));
      if (beforeData.status === ReportStatus.VERIFIED) {
        await analyticsRef.child("verifiedReports").set(
          ServerValue.increment(-1)
        );
      }
      logger.info("Reporte eliminado de estadísticas", {reportId});
      return;
    }

    if (afterData && !beforeData) {
      await analyticsRef.child("totalReports").set(ServerValue.increment(1));
      const today = new Date().toISOString().split("T")[0];
      await analyticsRef.child("reportsByDay").child(today).set(
        ServerValue.increment(1)
      );
      if (afterData.status === ReportStatus.VERIFIED) {
        await analyticsRef.child("verifiedReports").set(
          ServerValue.increment(1)
        );
      }
      logger.info("Estadísticas actualizadas para nuevo reporte", {reportId});
      return;
    }

    if (
      beforeData &&
      afterData &&
      beforeData.status !== afterData.status
    ) {
      const wasVerified = beforeData.status === ReportStatus.VERIFIED;
      const isVerified = afterData.status === ReportStatus.VERIFIED;

      if (!wasVerified && isVerified) {
        await analyticsRef.child("verifiedReports").set(
          ServerValue.increment(1)
        );
      }

      if (wasVerified && !isVerified) {
        await analyticsRef.child("verifiedReports").set(
          ServerValue.increment(-1)
        );
      }

      logger.info("Estadísticas actualizadas por cambio de estado", {
        reportId,
        previousStatus: beforeData.status,
        newStatus: afterData.status,
      });
    }
  }
);
