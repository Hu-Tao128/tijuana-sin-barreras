/**
 * GOOGLE PLACES API
 * Basado en la guía detallada de Tijuana Sin Barreras
 *
 * Funciones:
 * - searchPlaces: Autocompletado de direcciones/lugares
 * - getPlaceDetails: Obtener coordenadas (lat/lng) de un placeId
 */

const FETCH_TIMEOUT_MS = 10000;

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), FETCH_TIMEOUT_MS),
    ),
  ]);
}

export async function searchPlaces(
  query: string,
  apiKey: string,
  userLocation?: { latitude: number; longitude: number },
) {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&language=es`;

    url += `&components=country:mx`;

    if (userLocation) {
      url += `&location=${userLocation.latitude},${userLocation.longitude}&radius=50000`;
    }

    console.log('[Places API] Llamando a:', url.replace(apiKey, '***'));

    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('[Places API] Respuesta inesperada:', data.status, data.error_message);
    } else if (data.predictions?.length === 0) {
      console.warn('[Places API] Cero predicciones. Verifica API key y restricciones.');
    }

    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.warn('[Places API] Timeout en Autocomplete');
      return { predictions: [] };
    }
    console.error('[Places API] Error en Autocomplete:', error);
    return { predictions: [] };
  }
}

export async function getPlaceDetails(placeId: string, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${apiKey}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('[Place Details] Error:', data.status, data.error_message);
      return null;
    }

    const location = data.result?.geometry?.location;
    if (!location) {
      console.warn('[Place Details] No se encontró geometry.location para placeId:', placeId);
      return null;
    }
    return { lat: location.lat, lng: location.lng };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.warn('[Place Details] Timeout');
    } else {
      console.error('[Place Details] Error:', error);
    }
    return null;
  }
}