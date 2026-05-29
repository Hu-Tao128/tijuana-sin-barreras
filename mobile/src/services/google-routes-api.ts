/**
 * GOOGLE ROUTES API
 * Basado en la guía detallada de Tijuana Sin Barreras
 * 
 * Función principal: getRoutes - Calcula rutas peatonales (WALK)
 * Parámetros:
 * - origin, destination: { latitude, longitude }
 * - apiKey: string
 * - avoidPoints: array de puntos { latitude, longitude } que la ruta debe rodear (via: false)
 */

export async function getRoutes(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  apiKey: string,
  avoidPoints: { latitude: number; longitude: number }[] = []
) {
  const body: any = {
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
    travelMode: 'WALK', // Peatonal
    computeAlternativeRoutes: true, // Pedir rutas alternativas
  };

  // Si hay puntos que evitar (obstáculos críticos), agregar como intermediateWaypoints con via: false
  if (avoidPoints.length > 0) {
    body.intermediateWaypoints = avoidPoints.map(p => ({
      location: {
        latLng: {
          latitude: p.latitude,
          longitude: p.longitude,
        },
      },
      via: false, // false = obliga a rodear el punto, no a pasar por él
    }));
  }

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Máscara de campos para obtener polyline, distancia, duración de cada paso y de la ruta completa
        'X-Goog-FieldMask':
          'routes.legs.steps.polyline,routes.legs.distance,routes.legs.duration,routes.polyline',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Routes API] Error HTTP:', response.status, data.error?.message);
      return null;
    }

    if (!data.routes || data.routes.length === 0) {
      console.warn('[Routes API] No se encontraron rutas para el origen/destino');
      return null;
    }

    return data; // { routes: [...] }
  } catch (error) {
    console.error('[Routes API] Error en la solicitud:', error);
    return null;
  }
}