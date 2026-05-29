import type { Libraries } from '@react-google-maps/api'

/**
 * Configuración compartida del loader de Google Maps.
 * Debe ser idéntica en todos los componentes que usan `useJsApiLoader`
 * para evitar el error "Loader must not be called again with different options".
 */
export const GOOGLE_MAPS_ID = 'tsb-google-maps'

// Constante a nivel de módulo: referencia estable entre renders.
// 'geometry' se usa para decodificar la polyline de la Routes API.
export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geometry']

// 'weekly' incluye PlaceAutocompleteElement (Places API New) ya en GA.
export const GOOGLE_MAPS_VERSION = 'weekly'

export const TIJUANA_CENTER = { lat: 32.5149, lng: -117.0382 }
