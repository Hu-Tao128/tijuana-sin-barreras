/**
 * services/gemini.ts
 * Análisis de accesibilidad con Gemini AI
 *
 * Equivalente a dashboard/src/services/gemini.ts
 * Usa la REST API de Gemini directamente (compatible con React Native)
 *
 * Requiere GEMINI_API_KEY en tu .env
 * Si no tienes Gemini, también funciona con GOOGLE_MAPS_API si está habilitado en el mismo proyecto.
 */

import { GEMINI_API_KEY } from './constants';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ControlPoint {
  lat: number;
  lng: number;
  aspectoARevisar: string;
  riesgo: 'bajo' | 'medio' | 'alto';
}

export interface AccessibilityReport {
  resumen: string;
  scoreAccesibilidad: number;
  recomendaciones: string[];
  puntosControl: ControlPoint[];
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface Obstacle {
  type: string;
  severity: string;
  distance: number;
  latitude: number;
  longitude: number;
}

const responseSchema = {
  type: 'OBJECT' as const,
  properties: {
    resumen: { type: 'STRING' as const },
    scoreAccesibilidad: { type: 'NUMBER' as const },
    recomendaciones: {
      type: 'ARRAY' as const,
      items: { type: 'STRING' as const },
    },
    puntosControl: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          lat: { type: 'NUMBER' as const },
          lng: { type: 'NUMBER' as const },
          aspectoARevisar: { type: 'STRING' as const },
          riesgo: { type: 'STRING' as const },
        },
        required: ['lat', 'lng', 'aspectoARevisar', 'riesgo'],
      },
    },
  },
  required: ['resumen', 'scoreAccesibilidad', 'recomendaciones', 'puntosControl'],
};

/**
 * Genera un análisis de accesibilidad usando Gemini AI,
 * combinando la ruta con los obstáculos reportados.
 */
export async function analyzeRouteWithGemini(
  routePoints: RoutePoint[],
  obstacles: Obstacle[],
  distanceMeters: number,
  apiKey?: string,
): Promise<AccessibilityReport> {
  const key = apiKey || GEMINI_API_KEY;

  if (!key) {
    throw new Error('API key de Gemini no configurada. Agrega GEMINI_API_KEY o GOOGLE_MAPS_API a tu .env');
  }

  const sampled = pickEvenly(routePoints, 10);

  const obstacleSummary =
    obstacles.length > 0
      ? `\n\nObstáculos reportados cerca de la ruta (${obstacles.length}):\n` +
        obstacles
          .map(
            (o) =>
              `- ${o.type} (severidad: ${o.severity}) a ${o.distance}m de la ruta, en coordenadas (${o.latitude.toFixed(5)}, ${o.longitude.toFixed(5)})`,
          )
          .join('\n')
      : '\n\nNo hay obstáculos reportados cerca de esta ruta.';

  const prompt = `Eres un auditor de accesibilidad urbana para personas con discapacidad
en Tijuana, México. Analiza una ruta peatonal de aproximadamente ${Math.round(distanceMeters)} metros
con ${sampled.length} puntos de control.${obstacleSummary}

Devuelve un JSON con:
- "resumen": máximo 2 frases cortas y claras evaluando la accesibilidad general de la ruta.
  Menciona los obstáculos encontrados y si la ruta es segura para silla de ruedas, bastón o
  personas con movilidad reducida.
- "scoreAccesibilidad": entero del 0 al 100 donde 100 es totalmente accesible.
  Penaliza rutas con obstáculos severos, banquetas bloqueadas o rampas dañadas.
- "recomendaciones": máximo 4 acciones concretas y breves (máx 12 palabras cada una).
- "puntosControl": para cada punto de la ruta, indica:
  - "lat" y "lng" (usa las coordenadas proporcionadas)
  - "aspectoARevisar": qué verificar en ese punto (máx 8 palabras)
  - "riesgo": "bajo", "medio" o "alto" según la cercanía a obstáculos

Sé conciso y usa solo la información proporcionada.

Puntos de la ruta:
${sampled.map((p, i) => `${i + 1}. ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`).join('\n')}`;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: responseSchema,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[Gemini] Error HTTP:', response.status, JSON.stringify(err));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[Gemini] Respuesta sin texto:', JSON.stringify(data));
      throw new Error('Gemini no devolvió texto');
    }

    return JSON.parse(text) as AccessibilityReport;
  } catch (error) {
    console.error('[Gemini] Error en análisis:', error);
    throw error;
  }
}

function pickEvenly<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = (arr.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)]);
}
