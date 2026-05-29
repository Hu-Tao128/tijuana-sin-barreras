/**
 * services/constants.ts
 * Configuraciones centralizadas y API keys
 * 
 * ⚠️ IMPORTANTE: Usa variables de entorno en producción
 * nunca expongas API keys en el código
 */

// GOOGLE APIS
export const GOOGLE_PLACES_API_KEY = 'AIzaSyDg5o-XQPbRxrZU8fYGWgcoSsfAiXrnb2k';
export const GOOGLE_ROUTES_API_KEY = 'AIzaSyDg5o-XQPbRxrZU8fYGWgcoSsfAiXrnb2k';

// UBICACIÓN POR DEFECTO (TIJUANA)
export const DEFAULT_LOCATION = {
  latitude: 32.5149,
  longitude: -117.0382,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// RADIUS PARA BÚSQUEDAS EN GOOGLE PLACES
export const PLACES_SEARCH_RADIUS = 50000; // 50 km

// RUTAS DE FIREBASE
export const FIRESTORE_COLLECTIONS = {
  REPORTS: 'reports',
  USERS: 'users',
  POI: 'poi', // Points of Interest
};

// TIPOS DE REPORTES DISPONIBLES
export const REPORT_TYPES = [
  { id: 'banqueta_bloqueada', label: 'Banqueta Bloqueada', color: '#ef4444' },
  { id: 'rampa_dañada', label: 'Rampa Dañada', color: '#ef4444' },
  { id: 'calle_cerrada', label: 'Calle Cerrada', color: '#ef4444' },
  { id: 'obstruccion', label: 'Obstrucción', color: '#f59e0b' },
  { id: 'superficie_peligrosa', label: 'Superficie Peligrosa', color: '#f59e0b' },
  { id: 'inundacion', label: 'Inundación', color: '#ef4444' },
  { id: 'obra_publica', label: 'Obra Pública', color: '#f59e0b' },
  { id: 'postes_bloqueando', label: 'Postes Bloqueando', color: '#f59e0b' },
];

// COLORES PARA ESTADOS
export const COLORS = {
  SAFE: '#10b981',      // Verde
  PARTIAL: '#f59e0b',   // Amarillo
  NOT_RECOMMENDED: '#ef4444', // Rojo
  PRIMARY: '#3b82f6',   // Azul
  SECONDARY: '#6b7280', // Gris
};

// SEVERIDADES
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};
