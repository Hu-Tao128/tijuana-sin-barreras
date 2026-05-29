import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import {AccessibilityPenalty} from "../types/AccessibilityScore";
import {MobilityProfile} from "../types/MobilityProfile";
import type {Report} from "../types/Report";

const OSRM_FOOT_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const CORRIDOR_METERS = 75;

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const ABx = bx - ax;
  const ABy = by - ay;
  const APx = px - ax;
  const APy = py - ay;

  const ab2 = ABx * ABx + ABy * ABy;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const projLat = ax + t * ABx;
  const projLng = ay + t * ABy;

  return haversineDistance(py, px, projLng, projLat);
}

function isBarrierCriticalForProfile(
  barrierType: string,
  profile?: MobilityProfile
): boolean {
  if (!profile) return false;

  if (
    (profile === MobilityProfile.WHEELCHAIR_ELECTRIC ||
      profile === MobilityProfile.WHEELCHAIR_MANUAL) &&
    (barrierType === "blocked_ramp" ||
      barrierType === "no_sidewalk" ||
      barrierType === "broken_sidewalk")
  ) {
    return true;
  }

  if (
    (profile === MobilityProfile.WALKER ||
      profile === MobilityProfile.CANE) &&
    (barrierType === "broken_sidewalk" || barrierType === "obstacle")
  ) {
    return true;
  }

  if (
    profile === MobilityProfile.AMBULATORY_LIMITED &&
    barrierType === "no_sidewalk"
  ) {
    return true;
  }

  return false;
}

export const generateAccessibleRoute = onCall(
  {maxInstances: 5, timeoutSeconds: 30},
  async (request) => {
    await verifyUser(request);
    const callerUid = getUserId(request);

    const {
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      mobilityProfileOverride,
    } = request.data as {
      originLat: number;
      originLng: number;
      destinationLat: number;
      destinationLng: number;
      mobilityProfileOverride?: string;
    };

    if (
      originLat === undefined || originLng === undefined ||
      destinationLat === undefined || destinationLng === undefined
    ) {
      throw new HttpsError(
        "invalid-argument",
        "originLat, originLng, destinationLat, destinationLng son requeridos."
      );
    }

    let mobilityProfile: MobilityProfile | undefined;
    let maxWalkingMeters: number | undefined;

    if (mobilityProfileOverride) {
      mobilityProfile = mobilityProfileOverride as MobilityProfile;
    } else {
      const firestore = getFirestore();
      const userDoc = await firestore.collection("users").doc(callerUid).get();

      if (userDoc.exists) {
        const data = userDoc.data() ?? {};
        mobilityProfile = data.mobilityProfile;
        maxWalkingMeters = data.maxWalkingMeters;
      }
    }

    const osrmCoordStr =
      `${originLng},${originLat};${destinationLng},${destinationLat}`;

    let polyline = "";
    let distanceMeters = 0;
    let durationSeconds = 0;
    let routeCoords: Array<{lat: number; lng: number}> = [];

    try {
      const osrmRes = await fetch(
        `${OSRM_FOOT_URL}/${osrmCoordStr}?geometries=polyline&overview=full&alternatives=false`
      );

      if (osrmRes.ok) {
        const osrmJson = await osrmRes.json() as {
          routes?: Array<{
            geometry?: string;
            distance?: number;
            duration?: number;
            legs?: Array<{steps?: Array<{
              geometry?: string;
              intersections?: Array<{location: [number, number]}>;
            }>}>;
          }>;
        };

        if (osrmJson.routes?.[0]) {
          const route = osrmJson.routes[0];
          polyline = route.geometry ?? "";
          distanceMeters = route.distance ?? 0;
          durationSeconds = route.duration ?? 0;

          routeCoords = [{lat: originLat, lng: originLng}];
          for (const leg of route.legs ?? []) {
            for (const step of leg.steps ?? []) {
              for (const inter of step.intersections ?? []) {
                routeCoords.push({lat: inter.location[1], lng: inter.location[0]});
              }
            }
          }
          routeCoords.push({lat: destinationLat, lng: destinationLng});
        }
      }
    } catch (err) {
      logger.warn("OSRM fallback — usando línea recta", err);
      routeCoords = [
        {lat: originLat, lng: originLng},
        {lat: destinationLat, lng: destinationLng},
      ];
    }

    if (routeCoords.length < 2) {
      routeCoords = [
        {lat: originLat, lng: originLng},
        {lat: destinationLat, lng: destinationLng},
      ];
    }

    const visibleLatDelta = Math.abs(destinationLat - originLat) + 0.02;
    const visibleLngDelta = Math.abs(destinationLng - originLng) + 0.02;

    const corridorBounds = {
      north: Math.max(originLat, destinationLat) + visibleLatDelta / 2,
      south: Math.min(originLat, destinationLat) - visibleLatDelta / 2,
      east: Math.max(originLng, destinationLng) + visibleLngDelta / 2,
      west: Math.min(originLng, destinationLng) - visibleLngDelta / 2,
    };

    const db = getDatabase();
    const reportsSnapshot = await db.ref("reports").once("value");

    const nearbyBarriers: Report[] = [];

    reportsSnapshot.forEach((child) => {
      const report = child.val() as Report;

      if (report.status === "archived") return;

      if (
        report.latitude >= corridorBounds.south &&
        report.latitude <= corridorBounds.north &&
        report.longitude >= corridorBounds.west &&
        report.longitude <= corridorBounds.east
      ) {
        nearbyBarriers.push(report);
      }
    });

    const warningsOnRoute: Report[] = [];
    const barriersInCorridor: Report[] = [];
    let totalPenalty = 0;
    let barriersAvoided = 0;

    for (const barrier of nearbyBarriers) {
      let minDist = Infinity;

      for (let i = 0; i < routeCoords.length - 1; i++) {
        const a = routeCoords[i];
        const b = routeCoords[i + 1];
        const dist = pointToSegmentDistance(
          barrier.longitude, barrier.latitude,
          a.lng, a.lat, b.lng, b.lat
        );
        if (dist < minDist) minDist = dist;
      }

      if (
        Math.abs(barrier.latitude - originLat) <= 0.01 ||
        (minDist <= CORRIDOR_METERS)
      ) {
        warningsOnRoute.push(barrier);
      } else {
        barriersInCorridor.push(barrier);
        barriersAvoided++;
      }

      if (minDist <= CORRIDOR_METERS) {
        const penalty = AccessibilityPenalty[barrier.type] ?? 10;
        totalPenalty += isBarrierCriticalForProfile(barrier.type, mobilityProfile)
          ? penalty * 2
          : penalty;
      }
    }

    const baseScore = 10;
    const normalizedPenalty = Math.min(totalPenalty / 10, 9);
    const accessibilityScore = Math.round((baseScore - normalizedPenalty) * 10) / 10;

    const reachedMaxDistance = maxWalkingMeters && distanceMeters > maxWalkingMeters;

    logger.info("Ruta accesible generada", {
      callerUid,
      mobilityProfile,
      distanceMeters,
      warnings: warningsOnRoute.length,
      avoided: barriersAvoided,
      score: accessibilityScore,
    });

    return {
      success: true,
      route: {
        polyline,
        distanceMeters,
        durationSeconds,
        warningsOnRoute: warningsOnRoute.map((r) => ({
          reportId: r.id,
          type: r.type,
          severity: r.severity,
          description: r.description,
          lat: r.latitude,
          lng: r.longitude,
        })),
        barriersInCorridor: barriersInCorridor.length,
        barriersAvoided,
        accessibilityScore,
        maxWalkingExceeded: reachedMaxDistance,
      },
    };
  }
);
