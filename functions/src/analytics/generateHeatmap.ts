import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {bboxCoveringPrefixes} from "../middleware/geohash";
import type {Report} from "../types/Report";

const CLUSTER_RADIUS_M = 250;
const GEO_QUERY_PRECISION = 5;

interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
}

function clusterReports(reports: Report[]): HeatPoint[] {
  const clusters: HeatPoint[] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < reports.length; i++) {
    if (assigned.has(i)) continue;

    const report = reports[i];
    let clusterLat = report.latitude;
    let clusterLng = report.longitude;
    const clusterIndices = [i];
    assigned.add(i);

    for (let j = i + 1; j < reports.length; j++) {
      if (assigned.has(j)) continue;

      const other = reports[j];
      const dLat = (other.latitude - clusterLat) * 111320;
      const dLng =
        (other.longitude - clusterLng) *
        111320 *
        Math.cos((clusterLat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist <= CLUSTER_RADIUS_M) {
        const nextCount = clusterIndices.length + 1;
        clusterLat =
          (clusterLat * clusterIndices.length + other.latitude) / nextCount;
        clusterLng =
          (clusterLng * clusterIndices.length + other.longitude) / nextCount;
        clusterIndices.push(j);
        assigned.add(j);
      }
    }

    const count = clusterIndices.length;
    const totalSeverity = clusterIndices.reduce(
      (sum, index) => sum + reports[index].severity,
      0
    );
    const avgSeverity = totalSeverity / count;
    const weight = count * (avgSeverity / 5);

    clusters.push({
      lat: Math.round(clusterLat * 1e6) / 1e6,
      lng: Math.round(clusterLng * 1e6) / 1e6,
      weight: Math.round(weight * 100) / 100,
    });
  }

  return clusters.sort((a, b) => b.weight - a.weight);
}

interface BoundsInput {
  north: number;
  south: number;
  east: number;
  west: number;
}

async function loadReportsByBounds(
  db: ReturnType<typeof getDatabase>,
  bounds?: BoundsInput
): Promise<Report[]> {
  if (!bounds) {
    const snapshot = await db.ref("reports").once("value");
    const reports: Report[] = [];
    snapshot.forEach((child) => {
      const report = child.val() as Report;
      if (report.status !== "archived") {
        reports.push(report);
      }
    });
    return reports;
  }

  const prefixes = bboxCoveringPrefixes(
    {north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west},
    GEO_QUERY_PRECISION
  );

  if (prefixes.length === 0 || prefixes.length > 15) {
    const snapshot = await db.ref("reports").once("value");
    const reports: Report[] = [];
    snapshot.forEach((child) => {
      const report = child.val() as Report;
      if (report.status !== "archived") {
        reports.push(report);
      }
    });
    return reports;
  }

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
      if (report.status !== "archived" && !reportsMap.has(report.id)) {
        reportsMap.set(report.id, report);
      }
    });
  }

  return [...reportsMap.values()].filter((r) =>
    r.latitude >= bounds.south &&
    r.latitude <= bounds.north &&
    r.longitude >= bounds.west &&
    r.longitude <= bounds.east
  );
}

export const generateHeatmap = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);

    const bounds = request.data as BoundsInput | undefined;

    const db = getDatabase();
    const activeReports = await loadReportsByBounds(db, bounds);

    const points = clusterReports(activeReports);

    logger.info("Heatmap generado por coordenadas", {
      totalReports: activeReports.length,
      clusters: points.length,
      hasBounds: !!bounds,
    });

    return {heatmap: points};
  }
);
