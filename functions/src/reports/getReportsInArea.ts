import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {verifyUser} from "../middleware/auth";
import {ReportStatus} from "../types/ReportStatus";
import type {Report} from "../types/Report";

export const getReportsInArea = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    const {
      north,
      south,
      east,
      west,
      status,
    } = request.data as {
      north: number;
      south: number;
      east: number;
      west: number;
      status?: string;
    };

    if (
      north === undefined || south === undefined ||
      east === undefined || west === undefined
    ) {
      return {success: true, reports: []};
    }

    const db = getDatabase();
    const reportsRef = db.ref("reports");
    const snapshot = await reportsRef.once("value");

    const reports: Report[] = [];

    snapshot.forEach((child) => {
      const report = child.val() as Report;

      if (
        report.latitude >= south &&
        report.latitude <= north &&
        report.longitude >= west &&
        report.longitude <= east
      ) {
        if (status && report.status !== status) return;
        if (report.status === ReportStatus.ARCHIVED) return;
        reports.push(report);
      }
    });

    return {success: true, reports};
  }
);
