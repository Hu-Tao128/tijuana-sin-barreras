import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import type {Report} from "../types/Report";

const CLUSTER_RADIUS_M = 250;

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
    let count = 1;
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
        clusterLat =
          (clusterLat * count + other.latitude) / (count + 1);
        clusterLng =
          (clusterLng * count + other.longitude) / (count + 1);
        count++;
        assigned.add(j);
      }
    }

    let totalSeverity = 0;
    let severityCount = 0;
    let k = i;
    while (k < reports.length) {
      if (assigned.has(k)) {
        totalSeverity += reports[k].severity;
        severityCount++;
      }
      k++;
    }

    const avgSeverity = severityCount > 0 ? totalSeverity / severityCount : 1;
    const weight = count * (avgSeverity / 5);

    clusters.push({
      lat: Math.round(clusterLat * 1e6) / 1e6,
      lng: Math.round(clusterLng * 1e6) / 1e6,
      weight: Math.round(weight * 100) / 100,
    });
  }

  return clusters.sort((a, b) => b.weight - a.weight);
}

export const generateHeatmap = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);

    const db = getDatabase();
    const reportsSnapshot = await db.ref("reports").once("value");

    const activeReports: Report[] = [];

    reportsSnapshot.forEach((child) => {
      const report = child.val() as Report;
      if (report.status !== "archived") {
        activeReports.push(report);
      }
    });

    const points = clusterReports(activeReports);

    logger.info("Heatmap generado por coordenadas", {
      totalReports: activeReports.length,
      clusters: points.length,
    });

    return {heatmap: points};
  }
);
