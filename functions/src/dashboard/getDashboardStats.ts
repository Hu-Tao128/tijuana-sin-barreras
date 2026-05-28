import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "../types/Role";
import {ReportStatus} from "../types/ReportStatus";
import type {Report} from "../types/Report";

interface DashboardStats {
  totalReports: number;
  verifiedReports: number;
  pendingReports: number;
  rejectedReports: number;
  archivedReports: number;
  totalUsers: number;
  reportsByType: Record<string, number>;
  recentReports: Report[];
}

export const getDashboardStats = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.CITIZEN);

    const db = getDatabase();
    const firestore = getFirestore();

    const [reportsSnapshot, usersSnapshot] =
      await Promise.all([
        db.ref("reports").once("value"),
        firestore.collection("users").count().get(),
      ]);

    const reports: Report[] = [];
    let pendingReports = 0;
    let verifiedReports = 0;
    let rejectedReports = 0;
    let archivedReports = 0;
    const reportsByType: Record<string, number> = {};

    reportsSnapshot.forEach((child) => {
      const report = child.val() as Report;
      reports.push(report);

      switch (report.status) {
      case ReportStatus.PENDING:
        pendingReports++;
        break;
      case ReportStatus.VERIFIED:
        verifiedReports++;
        break;
      case ReportStatus.REJECTED:
        rejectedReports++;
        break;
      case ReportStatus.ARCHIVED:
        archivedReports++;
        break;
      }

      reportsByType[report.type] = (reportsByType[report.type] || 0) + 1;
    });

    let totalUsers = usersSnapshot.data().count;

    const sortedReports = reports.sort(
      (a, b) => b.createdAt - a.createdAt
    );
    const recentReports = sortedReports.slice(0, 20);

    const stats: DashboardStats = {
      totalReports: reports.length,
      verifiedReports,
      pendingReports,
      rejectedReports,
      archivedReports,
      totalUsers,
      reportsByType,
      recentReports,
    };

    logger.info("Estadísticas del dashboard generadas");

    return {stats};
  }
);
