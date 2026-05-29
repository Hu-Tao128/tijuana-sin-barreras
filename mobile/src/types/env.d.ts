/**
 * types/env.d.ts
 * Tipos para variables de entorno
 *
 * Equivalente a vite-env.d.ts del dashboard
 *
 * Variables esperadas (configurar en tu archivo .env):
 *   GOOGLE_MAPS_API=<tu-api-key>
 *   GEMINI_API_KEY=<tu-gemini-key>   (opcional — usa GOOGLE_MAPS_API como fallback)
 *
 * La misma API key funciona para todos los servicios habilitados:
 *  - Geocoding API
 *  - Maps JavaScript API
 *  - Maps SDK for Android
 *  - Places API
 *  - Places API (New)
 *  - Routes API
 *  - Street View Static API
 */

declare module 'react-native-config' {
  interface Env {
    GOOGLE_MAPS_API: string;
    GEMINI_API_KEY: string;
  }

  const Config: Env;
  export default Config;
}
