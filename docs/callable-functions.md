# Callable Functions — Documentación de uso

Todas las cloud functions se invocan como **Callable Functions** de Firebase v2 desde el cliente (mobile o dashboard).

## Instalación del SDK

```bash
# Mobile (React Native)
yarn add @react-native-firebase/functions

# Dashboard (Web)
yarn add firebase
```

## Inicialización

```ts
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
```

---

## Reportes

### `createReport`

Crea un nuevo reporte de barrera de accesibilidad.

```ts
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const createReport = httpsCallable(functions, "createReport");

const result = await createReport({
  type: "blocked_ramp",
  severity: 8,
  description: "Rampa completamente bloqueada por escombros",
  photoUrl: "https://storage.googleapis.com/...",
  latitude: 32.5149,
  longitude: -117.0382,
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | `BarrierType` | Sí | Tipo de barrera |
| `latitude` | `number` | Sí | Latitud (-90 a 90) |
| `longitude` | `number` | Sí | Longitud (-180 a 180) |
| `severity` | `number` | No | Severidad 1-10 (default: 5) |
| `description` | `string` | No | Máx. 500 caracteres |
| `photoUrl` | `string` | No | URL de la foto en Storage |

**Respuesta:**
```json
{
  "success": true,
  "report": {
    "id": "-OABC123XYZ",
    "userId": "abc123",
    "type": "blocked_ramp",
    "severity": 8,
    "description": "Rampa bloqueada",
    "photoUrl": "https://...",
    "latitude": 32.5149,
    "longitude": -117.0382,
    "verified": false,
    "confirmations": 0,
    "rejections": 0,
    "status": "pending",
    "createdAt": 1740000000000
  }
}
```

**Errores:**
- `unauthenticated` — usuario no autenticado
- `invalid-argument` — datos inválidos (lat, lng, tipo)
- `resource-exhausted` — excedió límite de 10 reportes/día

---

### `confirmReport`

Confirma que un reporte es real.

```ts
const confirmReport = httpsCallable(functions, "confirmReport");

const result = await confirmReport({ reportId: "-OABC123XYZ" });
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a confirmar |

**Respuesta:**
```json
{
  "success": true,
  "confirmation": {
    "id": "-ODEF456ABC",
    "reportId": "-OABC123XYZ",
    "userId": "abc123",
    "isConfirmed": true,
    "createdAt": 1740000000000
  }
}
```

**Errores:**
- `not-found` — el reporte no existe
- `already-exists` — ya confirmaste este reporte

---

### `rejectReport`

Rechaza un reporte (indica que no es real o ya fue solucionado).

```ts
const rejectReport = httpsCallable(functions, "rejectReport");

const result = await rejectReport({ reportId: "-OABC123XYZ" });
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a rechazar |

**Respuesta:**
```json
{
  "success": true,
  "confirmation": {
    "id": "-OGHI789DEF",
    "reportId": "-OABC123XYZ",
    "userId": "abc123",
    "isConfirmed": false,
    "createdAt": 1740000000000
  }
}
```

---

### `archiveReport`

Archiva un reporte. **Requiere rol `moderator` o superior.**

```ts
const archiveReport = httpsCallable(functions, "archiveReport");

const result = await archiveReport({ reportId: "-OABC123XYZ" });
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a archivar |

**Respuesta:**
```json
{
  "success": true,
  "report": {
    "status": "archived",
    "updatedAt": 1740000000000
  }
}
```

**Errores:**
- `permission-denied` — no tiene rol moderator/official

---

## Gemini AI

### `classifyBarrierCallable`

Clasifica una barrera usando Gemini AI a partir de una descripción de texto.

```ts
const classifyBarrier = httpsCallable(functions, "classifyBarrierCallable");

const result = await classifyBarrier({
  description: "Hay una rampa para silla de ruedas completamente tapada por un montón de basura y escombros de construcción. No se puede pasar.",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | `string` | Sí | Descripción en lenguaje natural |

**Respuesta:**
```json
{
  "type": "blocked_ramp",
  "confidence": 0.92
}
```

**Errores:**
- `internal` — GEMINI_API_KEY no configurada
- `invalid-argument` — falta la descripción

---

### `calculateSeverityCallable`

Calcula la severidad (1-10) usando Gemini AI.

```ts
const calculateSeverity = httpsCallable(functions, "calculateSeverityCallable");

const result = await calculateSeverity({
  description: "Escaleras sin rampa alternativa, personas en silla de ruedas no pueden acceder al edificio",
  barrierType: "no_sidewalk",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `description` | `string` | Sí | Descripción de la barrera |
| `barrierType` | `string` | Sí | Tipo de barrera |

**Respuesta:**
```json
{
  "severity": 9
}
```

---

## Analíticas

### `generateHeatmap`

Genera un mapa de calor agrupando reportes por zona de Tijuana.

```ts
const generateHeatmap = httpsCallable(functions, "generateHeatmap");

const result = await generateHeatmap();
```

**Sin parámetros.**

**Respuesta:**
```json
{
  "heatmap": [
    { "zone": "Zona Río", "count": 87 },
    { "zone": "Centro", "count": 45 },
    { "zone": "Otay", "count": 32 },
    { "zone": "La Mesa", "count": 28 },
    { "zone": "Playas de Tijuana", "count": 15 },
    { "zone": "Otra zona", "count": 12 }
  ]
}
```

---

## Dashboard

### `getDashboardStats`

Obtiene estadísticas completas para el dashboard. **Requiere autenticación (cualquier rol).**

```ts
const getDashboardStats = httpsCallable(functions, "getDashboardStats");

const result = await getDashboardStats();
```

**Respuesta:**
```json
{
  "stats": {
    "totalReports": 219,
    "verifiedReports": 87,
    "pendingReports": 102,
    "rejectedReports": 18,
    "archivedReports": 12,
    "totalUsers": 56,
    "reportsByType": {
      "broken_sidewalk": 78,
      "blocked_ramp": 52,
      "no_sidewalk": 34,
      "obstacle": 29,
      "dangerous_crossing": 16,
      "construction": 7,
      "other": 3
    },
    "recentReports": [
      {
        "id": "-OABC123XYZ",
        "type": "blocked_ramp",
        "status": "pending",
        "createdAt": 1740000000000
      }
    ]
  }
}
```

---

### `exportCsv`

Exporta todos los reportes en formato CSV. **Requiere rol `moderator` o superior.**

```ts
const exportCsv = httpsCallable(functions, "exportCsv");

const result = await exportCsv();

// result.data.csv contiene el CSV completo
// Descargar como archivo:
const blob = new Blob([result.data.csv], { type: "text/csv" });
const url = URL.createObjectURL(blob);
```

**Sin parámetros.**

**Respuesta:**
```json
{
  "csv": "id,userId,type,severity,description,photoUrl,latitude,...\n-OABC123XYZ,abc123,blocked_ramp,8,...",
  "totalReports": 219
}
```

---

## Errores comunes

| Código | Significado |
|--------|-------------|
| `unauthenticated` | Inicia sesión antes de llamar esta función |
| `permission-denied` | No tienes el rol necesario (moderator/official) |
| `invalid-argument` | Revisa los parámetros enviados |
| `not-found` | El reporte solicitado no existe |
| `already-exists` | Ya realizaste esta acción sobre este reporte |
| `resource-exhausted` | Excediste el límite de rate limiting |
| `internal` | Error del servidor (posiblemente falta GEMINI_API_KEY) |

---

## Tipos de barrera (`BarrierType`)

| Valor | Etiqueta |
|-------|----------|
| `broken_sidewalk` | Banqueta rota |
| `blocked_ramp` | Rampa bloqueada |
| `no_sidewalk` | Sin banqueta |
| `construction` | Construcción |
| `obstacle` | Obstáculo |
| `dangerous_crossing` | Cruce peligroso |
| `other` | Otro |

---

## Estados de reporte (`ReportStatus`)

| Valor | Significado |
|-------|-------------|
| `pending` | Pendiente de revisión |
| `verified` | Verificado por la comunidad |
| `rejected` | Rechazado por la comunidad |
| `archived` | Archivado por moderador |
