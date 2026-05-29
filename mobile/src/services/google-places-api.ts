/**
 * GOOGLE PLACES API
 * Basado en la guía detallada de Tijuana Sin Barreras
 * 
 * Funciones:
 * - searchPlaces: Autocompletado de direcciones/lugares
 * - getPlaceDetails: Obtener coordenadas (lat/lng) de un placeId
 */

export async function searchPlaces(
  query: string,
  apiKey: string,
  userLocation?: { latitude: number; longitude: number }
) {
  try {
    // Construir URL base
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&language=es`;

    // === OPCIÓN: filtrar solo México (puede causar problemas si el lugar no está en MX) ===
    // Si no obtienes resultados, comenta la siguiente línea para hacer la búsqueda global.
    url += `&components=country:mx`;

    // Si tenemos ubicación del usuario, agregar bias para mejorar resultados
    if (userLocation) {
      url += `&location=${userLocation.latitude},${userLocation.longitude}&radius=50000`; // 50km
    }

    console.log('[Places API] Llamando a:', url.replace(apiKey, '***')); // Debug (oculta key)

    const response = await fetch(url);
    const data = await response.json();

    // Depuración: mostrar respuesta completa si hay error o cero resultados
    if (data.status !== 'OK') {
      console.warn('[Places API] Respuesta inesperada:', data.status, data.error_message);
    } else if (data.predictions?.length === 0) {
      console.warn('[Places API] Cero predicciones. Verifica API key y restricciones.');
    }

    return data; // { predictions: [...] }
  } catch (error) {
    console.error('[Places API] Error en Autocomplete:', error);
    return { predictions: [] };
  }
}

export async function getPlaceDetails(placeId: string, apiKey: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('[Place Details] Error:', data.status, data.error_message);
      return null;
    }

    // Retorna { lat, lng } como espera el resto de la app
    const location = data.result?.geometry?.location;
    if (!location) {
      console.warn('[Place Details] No se encontró geometry.location para placeId:', placeId);
      return null;
    }
    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    console.error('[Place Details] Error:', error);
    return null;
  }
}