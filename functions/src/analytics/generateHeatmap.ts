import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import type {Report, HeatmapZone} from "@tijuanasinbarreras/shared";

function getZoneName(latitude: number, longitude: number): string {
  const zones: Array<{
    name: string;
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  }> = [
    {
      name: "Zona Río",
      latMin: 32.5100,
      latMax: 32.5300,
      lngMin: -117.0200,
      lngMax: -116.9900,
    },
    {
      name: "Centro",
      latMin: 32.5200,
      latMax: 32.5350,
      lngMin: -117.0450,
      lngMax: -117.0200,
    },
    {
      name: "Otay",
      latMin: 32.4900,
      latMax: 32.5100,
      lngMin: -116.9400,
      lngMax: -116.9100,
    },
    {
      name: "Playas de Tijuana",
      latMin: 32.5200,
      latMax: 32.5450,
      lngMin: -117.1200,
      lngMax: -117.0900,
    },
    {
      name: "La Mesa",
      latMin: 32.5000,
      latMax: 32.5150,
      lngMin: -116.9900,
      lngMax: -116.9600,
    },
  ];

  for (const zone of zones) {
    if (
      latitude >= zone.latMin &&
      latitude <= zone.latMax &&
      longitude >= zone.lngMin &&
      longitude <= zone.lngMax
    ) {
      return zone.name;
    }
  }

  return "Otra zona";
}

export const generateHeatmap = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);

    const db = getDatabase();
    const reportsRef = db.ref("reports");
    const snapshot = await reportsRef.once("value");

    const zoneCounts: Record<string, number> = {};

    snapshot.forEach((child) => {
      const report = child.val() as Report;
      const zone = getZoneName(report.latitude, report.longitude);

      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });

    const heatmap: HeatmapZone[] = Object.entries(zoneCounts)
      .map(([zone, count]) => ({zone, count}))
      .sort((a, b) => b.count - a.count);

    logger.info("Mapa de calor generado", {zones: heatmap.length});

    return {heatmap};
  }
);
