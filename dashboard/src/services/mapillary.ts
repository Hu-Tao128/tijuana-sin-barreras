const token = import.meta.env.VITE_MAPILLARY_TOKEN

const GRAPH_ENDPOINT = 'https://graph.mapillary.com/images'

export type StreetImage = {
  id: string
  imageUrl: string
  lat: number
  lng: number
}

type MapillaryImage = {
  id: string
  thumb_1024_url?: string
  computed_geometry?: { coordinates: [number, number] }
  geometry?: { coordinates: [number, number] }
}

// Aproximación: ~111.32 km por grado de latitud.
function metersToDegrees(meters: number, lat: number) {
  const latDeg = meters / 111_320
  const lngDeg = meters / (111_320 * Math.cos((lat * Math.PI) / 180))
  return { latDeg, lngDeg }
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6_371_000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function queryClosest(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<StreetImage | null> {
  const { latDeg, lngDeg } = metersToDegrees(radiusMeters, lat)
  const bbox = [lng - lngDeg, lat - latDeg, lng + lngDeg, lat + latDeg].join(',')
  // El token NO puede ir en el query: el navegador codifica los "|" como %7C y
  // Mapillary devuelve 200 con data vacía. Va en el header Authorization
  // (Mapillary permite el preflight CORS para "authorization").
  const url = `${GRAPH_ENDPOINT}?fields=id,thumb_1024_url,computed_geometry,geometry&bbox=${bbox}&limit=50`

  let response: Response
  try {
    response = await fetch(url, { headers: { Authorization: `OAuth ${token}` } })
  } catch (err) {
    console.warn('[Mapillary] fetch falló', err)
    return null
  }
  if (!response.ok) {
    console.warn('[Mapillary] HTTP', response.status, 'radio', radiusMeters)
    return null
  }

  const data = (await response.json()) as { data?: MapillaryImage[] }
  const images = data.data ?? []
  if (images.length === 0) return null

  let best: StreetImage | null = null
  let bestDistance = Infinity

  for (const image of images) {
    const coords = image.computed_geometry?.coordinates ?? image.geometry?.coordinates
    if (!coords || !image.thumb_1024_url) continue
    const [imgLng, imgLat] = coords
    const distance = haversine(lat, lng, imgLat, imgLng)
    if (distance < bestDistance) {
      bestDistance = distance
      best = { id: image.id, imageUrl: image.thumb_1024_url, lat: imgLat, lng: imgLng }
    }
  }

  return best
}

/**
 * Busca la imagen de calle de Mapillary más cercana a un punto.
 * Usa una bbox de ~500 m porque las cajas muy pequeñas devuelven vacío aunque
 * exista cobertura; amplía una vez si no encuentra nada.
 * Devuelve null si no hay ninguna imagen cercana.
 */
export async function findStreetImage(
  lat: number,
  lng: number,
  baseRadiusMeters = 300,
): Promise<StreetImage | null> {
  if (!token) {
    console.warn('[Mapillary] Falta VITE_MAPILLARY_TOKEN; no se buscarán imágenes.')
    return null
  }

  const radii = [baseRadiusMeters, baseRadiusMeters * 2]
  for (const radius of radii) {
    const result = await queryClosest(lat, lng, radius)
    if (result) return result
  }
  return null
}

/** Descarga una imagen y la convierte a base64 (sin el prefijo data URL). */
export async function imageToBase64(
  url: string,
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const base64 = dataUrl.split(',')[1] ?? ''
    return { mimeType: blob.type || 'image/jpeg', data: base64 }
  } catch {
    return null
  }
}
