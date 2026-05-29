import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {requireRole} from "../middleware/roles";
import {Role} from "@tijuanasinbarreras/shared";
import type {Report} from "@tijuanasinbarreras/shared";

function escapeCsvField(field: string | number | boolean | undefined | null): string {
  if (field === undefined || field === null) return "";
  const str = String(field);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

function buildCsv(reports: Report[]): string {
  const headers = [
    "id",
    "userId",
    "type",
    "severity",
    "description",
    "photoUrl",
    "latitude",
    "longitude",
    "verified",
    "confirmations",
    "rejections",
    "status",
    "createdAt",
    "updatedAt",
  ];

  const headerRow = headers.join(",");

  const rows = reports.map((report) =>
    headers.map((h) => escapeCsvField(report[h as keyof Report])).join(",")
  );

  return [headerRow, ...rows].join("\n");
}

export const exportCsv = onCall(
  {maxInstances: 5, timeoutSeconds: 120},
  async (request) => {
    await verifyUser(request);
    await requireRole(request, Role.MODERATOR);

    const db = getDatabase();
    const reportsSnapshot = await db.ref("reports").once("value");

    const reports: Report[] = [];

    reportsSnapshot.forEach((child) => {
      reports.push(child.val() as Report);
    });

    if (reports.length === 0) {
      throw new HttpsError("not-found", "No hay reportes para exportar.");
    }

    const csv = buildCsv(reports);

    logger.info("CSV exportado", {
      reportCount: reports.length,
      csvSize: csv.length,
    });

    return {csv, totalReports: reports.length};
  }
);
