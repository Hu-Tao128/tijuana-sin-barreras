import { GoogleGenAI, Type, type Part } from '@google/genai'
import { imageToBase64, type StreetImage } from './mapillary'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

// Nota: exponer la API key en el navegador es aceptable solo para pruebas/PoC.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export type RouteControlPoint = { lat: number; lng: number }

export type RouteAccessibilityReport = {
  resumen: string
  scoreAccesibilidad: number
  recomendaciones: string[]
  puntosControl: Array<{
    lat: number
    lng: number
    aspectoARevisar: string
    riesgo: 'bajo' | 'medio' | 'alto'
  }>
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    resumen: { type: Type.STRING },
    scoreAccesibilidad: { type: Type.NUMBER },
    recomendaciones: { type: Type.ARRAY, items: { type: Type.STRING } },
    puntosControl: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER },
          aspectoARevisar: { type: Type.STRING },
          riesgo: { type: Type.STRING },
        },
        required: ['lat', 'lng', 'aspectoARevisar', 'riesgo'],
      },
    },
  },
  required: ['resumen', 'scoreAccesibilidad', 'recomendaciones', 'puntosControl'],
}

/**
 * Genera una auditoría preliminar de accesibilidad peatonal de una ruta,
 * preparando los puntos de control para una futura inspección visual.
 */
export async function analyzeRouteAccessibility(
  points: RouteControlPoint[],
  distanceMeters: number,
): Promise<RouteAccessibilityReport> {
  if (!ai) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada.')
  }

  const prompt = `Eres un auditor de accesibilidad urbana para personas con discapacidad
en Tijuana, México. Analiza una ruta peatonal con ${points.length} puntos de control
y una distancia aproximada de ${Math.round(distanceMeters)} metros.

Devuelve:
- "resumen": máximo 2 frases cortas, claras y directas. NO uses listas dentro del resumen.
- "scoreAccesibilidad": entero del 0 al 100.
- "recomendaciones": máximo 4 acciones, cada una en una frase corta (máx. 12 palabras).
- "puntosControl": para cada punto, un "aspectoARevisar" breve (máx. 8 palabras) y
  su "riesgo" (bajo, medio o alto).

Sé conciso. Evita texto largo o repetido.

Puntos de control (lat, lng):
${points.map((p, i) => `${i + 1}. ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`).join('\n')}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  })

  const text = response.text ?? ''
  return JSON.parse(text) as RouteAccessibilityReport
}

/**
 * Auditoría visual: envía imágenes a nivel de calle (Mapillary) a Gemini Vision
 * para evaluar la accesibilidad real observada en cada punto de la ruta.
 */
export async function analyzeRouteWithImages(
  images: StreetImage[],
  distanceMeters: number,
): Promise<RouteAccessibilityReport> {
  if (!ai) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada.')
  }

  const encoded = await Promise.all(images.map((img) => imageToBase64(img.imageUrl)))
  const valid = images
    .map((img, i) => ({ img, data: encoded[i] }))
    .filter((entry): entry is { img: StreetImage; data: { mimeType: string; data: string } } =>
      entry.data !== null,
    )

  if (valid.length === 0) {
    throw new Error('No se pudieron cargar las imágenes de calle.')
  }

  const intro = `Eres un auditor de accesibilidad urbana para personas con discapacidad
en Tijuana, México. A continuación recibes ${valid.length} imágenes reales a nivel de
calle, tomadas a lo largo de una ruta peatonal de ${Math.round(distanceMeters)} metros.

Analiza CADA imagen y observa: estado de la banqueta (grietas, desniveles), existencia
y estado de rampas, obstáculos (postes, autos, comercio), seguridad de cruces y
señalización. Basa tu análisis ÚNICAMENTE en lo que se ve en las imágenes.

Devuelve JSON con:
- "resumen": máximo 2 frases cortas sobre el estado general observado.
- "scoreAccesibilidad": entero 0-100 según lo observado.
- "recomendaciones": máximo 4 acciones cortas (máx. 12 palabras).
- "puntosControl": un objeto por imagen, en el MISMO orden, con su lat/lng,
  "aspectoARevisar" = lo observado en esa imagen (máx. 10 palabras) y "riesgo"
  (bajo, medio o alto).`

  const parts: Part[] = [{ text: intro }]
  valid.forEach((entry, index) => {
    parts.push({
      text: `Imagen ${index + 1} — punto (${entry.img.lat.toFixed(5)}, ${entry.img.lng.toFixed(5)}):`,
    })
    parts.push({ inlineData: { mimeType: entry.data.mimeType, data: entry.data.data } })
  })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: parts,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  })

  const text = response.text ?? ''
  return JSON.parse(text) as RouteAccessibilityReport
}
