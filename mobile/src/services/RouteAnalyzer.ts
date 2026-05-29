/**
 * RouteAnalyzer.ts
 * Analiza rutas peatonales contra obstáculos reportados
 * Calcula niveles de accesibilidad e identifica riesgos
 */

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteStep {
  startLocation: Coordinate;
  endLocation: Coordinate;
  polyline: {
    encodedPolyline: string;
  };
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  date: number;
  description?: string;
}

interface RouteRisk {
  reportId: string;
  distance: number; // en metros
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
}

interface AnalysisResult {
  riskLevel: 'safe' | 'partial' | 'not_recommended';
  totalRisks: number;
  nearbyObstacles: RouteRisk[];
  riskScore: number; // 0-100
  recommendations: string[];
}

/**
 * Decodifica polyline encoded (formato Google)
 */
function decodePolyline(encoded: string): Coordinate[] {
  let inv = 1.0 / 1e5;
  let decoded: Coordinate[] = [];
  let previous: Coordinate = { latitude: 0, longitude: 0 };

  let i = 0;
  while (i < encoded.length) {
    let ll: Coordinate = { latitude: 0, longitude: 0 };

    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let result = 0;

      while (true) {
        let b = encoded.charCodeAt(i++) - 63 - (j === 1 ? 32 : 0);
        result |= (b & 0x1f) << shift;
        shift += 5;

        if (b < 0x20) break;
      }

      let dpDp = result & 1 ? ~(result >> 1) : result >> 1;

      if (j === 0) {
        ll.latitude = previous.latitude + dpDp * inv;
      } else {
        ll.longitude = previous.longitude + dpDp * inv;
      }
    }

    previous = ll;
    decoded.push(ll);
  }

  return decoded;
}

/**
 * Calcula la distancia en metros entre dos coordenadas (Haversine)
 */
function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Encuentra la distancia más cercana entre un punto y todos los puntos de la ruta
 */
function getClosestDistanceToRoute(
  point: Coordinate,
  routeCoordinates: Coordinate[],
): number {
  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const distance = getPointToSegmentDistance(
      point,
      routeCoordinates[i],
      routeCoordinates[i + 1],
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Distancia de un punto a un segmento de línea
 */
function getPointToSegmentDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate,
): number {
  const A = point.latitude - lineStart.latitude;
  const B = point.longitude - lineStart.longitude;
  const C = lineEnd.latitude - lineStart.latitude;
  const D = lineEnd.longitude - lineStart.longitude;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.latitude;
    yy = lineStart.longitude;
  } else if (param > 1) {
    xx = lineEnd.latitude;
    yy = lineEnd.longitude;
  } else {
    xx = lineStart.latitude + param * C;
    yy = lineStart.longitude + param * D;
  }

  const dx = point.latitude - xx;
  const dy = point.longitude - yy;

  return Math.sqrt(dx * dx + dy * dy) * 111000; // Convertir a metros aproximadamente
}

/**
 * Analiza una ruta contra los obstáculos reportados
 */
export function analyzeRoute(
  routeSteps: RouteStep[],
  reports: Report[],
): AnalysisResult {
  const proximityRadii: { [key: string]: number } = {
    'banqueta_bloqueada': 15,
    'rampa_dañada': 20,
    'calle_cerrada': 30,
    'obstruccion': 25,
    'superficie_peligrosa': 15,
    'inundacion': 25,
    'obra_publica': 20,
    'postes_bloqueando': 10,
  };

  const nearbyObstacles: RouteRisk[] = [];

  // Procesar cada step de la ruta
  for (const step of routeSteps) {
    try {
      const routeCoordinates = decodePolyline(
        step.polyline.encodedPolyline,
      );

      // Comparar con cada reporte
      for (const report of reports) {
        const proximityRadius =
          proximityRadii[report.type] || 20;
        const closestDistance = getClosestDistanceToRoute(
          { latitude: report.latitude, longitude: report.longitude },
          routeCoordinates,
        );

        if (closestDistance <= proximityRadius) {
          nearbyObstacles.push({
            reportId: report.id,
            distance: Math.round(closestDistance),
            type: report.type,
            severity: report.severity,
            latitude: report.latitude,
            longitude: report.longitude,
          });
        }
      }
    } catch (error) {
      console.log('Error decoding polyline:', error);
    }
  }

  // Calcular nivel de riesgo
  const severityScores = {
    high: 30,
    medium: 15,
    low: 5,
  };

  let riskScore = 0;
  nearbyObstacles.forEach(obstacle => {
    const severityScore = severityScores[obstacle.severity as keyof typeof severityScores] || 10;
    const proximityFactor = Math.max(
      0,
      1 - obstacle.distance / 50,
    );
    riskScore += severityScore * proximityFactor;
  });

  riskScore = Math.min(100, riskScore);

  // Determinar nivel de riesgo
  let riskLevel: 'safe' | 'partial' | 'not_recommended' = 'safe';
  if (riskScore > 60) {
    riskLevel = 'not_recommended';
  } else if (riskScore > 20) {
    riskLevel = 'partial';
  }

  // Generar recomendaciones
  const recommendations: string[] = [];

  if (nearbyObstacles.length > 0) {
    const highSeverity = nearbyObstacles.filter(
      o => o.severity === 'high',
    );
    const mediumSeverity = nearbyObstacles.filter(
      o => o.severity === 'medium',
    );

    if (highSeverity.length > 0) {
      recommendations.push(
        `⚠️ Se detectó${highSeverity.length > 1 ? 'ron' : ''} ${highSeverity.length} obstrucción(es) severa(s)`,
      );
    }

    if (mediumSeverity.length > 0) {
      recommendations.push(
        `⚠️ Hay ${mediumSeverity.length} obstáculo(s) cercano(s)`,
      );
    }

    recommendations.push(
      '💡 Considera buscar una ruta alternativa más accesible',
    );
  } else {
    recommendations.push('✅ Ruta sin obstáculos detectados');
  }

  return {
    riskLevel,
    totalRisks: nearbyObstacles.length,
    nearbyObstacles,
    riskScore: Math.round(riskScore),
    recommendations,
  };
}

/**
 * Calcula score de accesibilidad (0-100)
 */
export function calculateAccessibilityScore(
  analysisResult: AnalysisResult,
): number {
  return 100 - analysisResult.riskScore;
}

/**
 * Obtiene color basado en nivel de riesgo
 */
export function getRiskColor(
  riskLevel: 'safe' | 'partial' | 'not_recommended',
): string {
  const colors = {
    safe: '#10b981', // Verde
    partial: '#f59e0b', // Amarillo
    not_recommended: '#ef4444', // Rojo
  };
  return colors[riskLevel];
}

/**
 * Obtiene descripción legible del nivel de riesgo
 */
export function getRiskLevelDescription(
  riskLevel: 'safe' | 'partial' | 'not_recommended',
): string {
  const descriptions = {
    safe: 'Ruta segura',
    partial: 'Parcialmente accesible',
    not_recommended: 'No recomendada',
  };
  return descriptions[riskLevel];
}
