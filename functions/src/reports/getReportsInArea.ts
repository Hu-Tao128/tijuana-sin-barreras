import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {verifyUser} from "../middleware/auth";
import {bboxCoveringPrefixes} from "../middleware/geohash";
import {ReportStatus} from "../types/ReportStatus";
import type {Report} from "../types/Report";

const GEO_QUERY_PRECISION = 5;

async function queryByGeohashPrefixes(
  db: ReturnType<typeof getDatabase>,
  prefixes: string[]
): Promise<Report[]> {
  const reportsMap = new Map<string, Report>();
  const reportsRef = db.ref("reports");

  for (const prefix of prefixes) {
    const snapshot = await reportsRef
      .orderByChild("geohash")
      .startAt(prefix)
      .endAt(prefix + "\uf8ff")
      .once("value");

    snapshot.forEach((child) => {
      const report = child.val() as Report;
      if (!reportsMap.has(report.id)) {
        reportsMap.set(report.id, report);
      }
    });
  }

  return [...reportsMap.values()];
}

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

    const bboxResult = bboxCoveringPrefixes(
      {north, south, east, west},
      GEO_QUERY_PRECISION
    );

    let reports: Report[];

    if (bboxResult.length === 0) {
      reports = [];
    } else if (bboxResult.length <= 10) {
      reports = await queryByGeohashPrefixes(db, bboxResult);
    } else {
      const reportsRef = db.ref("reports");
      const snapshot = await reportsRef.once("value");
      reports = [];
      snapshot.forEach((child) => {
        reports.push(child.val() as Report);
      });
    }

    const filtered = reports.filter((report) => {
      if (
        report.latitude < south ||
        report.latitude > north ||
        report.longitude < west ||
        report.longitude > east
      ) {
        return false;
      }

      if (status && report.status !== status) return false;
      if (report.status === ReportStatus.ARCHIVED) return false;

      return true;
    });

    return {success: true, reports: filtered};
  }
);
