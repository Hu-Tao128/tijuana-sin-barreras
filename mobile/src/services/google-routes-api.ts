/**
 * GOOGLE ROUTES API
 * Calcula rutas peatonales (WALK) usando el endpoint computeRoutes (v2)
 *
 * Endpoint: POST https://routes.googleapis.com/directions/v2:computeRoutes
 * Docs: https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
 *
 * La respuesta de la API se normaliza para que coincida con las interfaces
 * esperadas por RouteScreen y RouteAnalyzer.
 */

const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options?.signal;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const requestOptions: RequestInit = {
    ...options,
    signal: controller.signal,
  };

  try {
    return await fetch(url, requestOptions);
  } finally {
    clearTimeout(timeoutId);
  }
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RawRouteStep {
  distanceMeters: number;
  staticDuration: string;
  polyline?: { encodedPolyline: string };
  startLocation?: { latLng: Coordinate };
  endLocation?: { latLng: Coordinate };
}

interface NormalizedStep {
  startLocation: Coordinate;
  endLocation: Coordinate;
  polyline: { encodedPolyline: string };
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  [key: string]: unknown;
}

interface RawRouteLeg {
  distanceMeters: number;
  duration: string;
  steps: RawRouteStep[];
}

interface NormalizedLeg {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  steps: NormalizedStep[];
  [key: string]: unknown;
}

interface RawRoute {
  legs: RawRouteLeg[];
  distanceMeters: number;
  duration: string;
  polyline?: { encodedPolyline: string };
  [key: string]: unknown;
}

interface NormalizedRoute {
  legs: NormalizedLeg[];
  distanceMeters: number;
  duration: string;
  polyline?: { encodedPolyline: string };
  [key: string]: unknown;
}

function parseDuration(secondsOrString: number | string): { value: number; text: string } {
  let totalSeconds: number;
  if (typeof secondsOrString === 'string') {
    // "123s" → 123
    totalSeconds = parseInt(secondsOrString, 10) || 0;
  } else {
    totalSeconds = secondsOrString;
  }

  if (totalSeconds < 60) {
    return { value: totalSeconds, text: `${totalSeconds} seg` };
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return { value: totalSeconds, text: `${minutes} min` };
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return {
    value: totalSeconds,
    text: remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`,
  };
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Normaliza la respuesta de la API al formato esperado por RouteScreen y RouteAnalyzer.
 * La API v2 usa camelCase (distanceMeters, staticDuration, etc).
 */
function normalizeRoute(raw: RawRoute): NormalizedRoute {
  return {
    ...raw,
    legs: raw.legs.map((leg) => ({
      ...leg,
      distance: { value: leg.distanceMeters, text: formatDistance(leg.distanceMeters) },
      duration: parseDuration(leg.duration),
      steps: (leg.steps || []).map((step): NormalizedStep => ({
        startLocation: step.startLocation?.latLng || { latitude: 0, longitude: 0 },
        endLocation: step.endLocation?.latLng || { latitude: 0, longitude: 0 },
        polyline: step.polyline || { encodedPolyline: '' },
        distance: {
          value: step.distanceMeters,
          text: formatDistance(step.distanceMeters),
        },
        duration: parseDuration(step.staticDuration || '0s'),
      })),
    })),
  };
}

export async function getRoutes(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  apiKey: string,
  avoidPoints: { latitude: number; longitude: number }[] = [],
  signal?: AbortSignal,
) {
  const body: Record<string, unknown> = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode: 'WALK',
    computeAlternativeRoutes: true,
    languageCode: 'es',
    units: 'METRIC',
  };

  if (avoidPoints.length > 0) {
    console.warn(
      '[Routes API] WALK mode does not support obstacle avoidance via intermediates. ' +
      `Skipping ${avoidPoints.length} avoidPoints.`,
    );
  }

  try {
    const response = await fetchWithTimeout(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.startLocation,routes.legs.steps.endLocation',
        },
        body: JSON.stringify(body),
        signal,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        '[Routes API] Error HTTP:',
        response.status,
        JSON.stringify(data.error || data, null, 2),
      );
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.warn('[Routes API] No se encontraron rutas para el origen/destino');
      return null;
    }

    return {
      routes: data.routes.map((r: RawRoute) => normalizeRoute(r)),
    };
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      console.warn('[Routes API] Solicitud cancelada');
      throw error;
    }
    console.error('[Routes API] Error en la solicitud:', error);
    return null;
  }
}
