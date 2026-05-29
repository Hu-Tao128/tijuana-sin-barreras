# Callable Functions — Documentación de uso

Todas las cloud functions se invocan como **Callable Functions** de Firebase v2 desde el cliente (mobile o dashboard).

## Estado actual

Esta guía describe el estado implementado hoy en `functions/` y los contratos compartidos de `shared/`.

- `generateAccessibleRoute`, `getReportsInArea`, `generateHeatmap` usan **geohash** para consultas geoespaciales indexadas en Realtime Database (sin full scan).
- `confirmReport` y `rejectReport` son **atómicas e idempotentes**: clave determinista `{reportId}_{userId}` evita votos duplicados por condición de carrera.
- `registerUserProfile` usa `request.auth.uid` del servidor, ignora cualquier `uid` enviado por el cliente y solo acepta campos editables.
- `getCurrentUserProfile` devuelve el perfil completo de Firestore + Auth, separando campos administrados por backend de campos editables.
- `deleteMyReport` también **elimina la foto asociada en Storage**, evitando archivos huérfanos.
- `archiveReport` soporta motivo de archivado y marca `resolvedAt` cuando el motivo es `fixed`.
- `updateStatistics` es un trigger interno de RTDB; no es callable desde cliente.
- Las reglas de Firestore ahora son solo lectura desde cliente; toda escritura pasa por Cloud Functions (admin SDK).
- Los reportes nuevos incluyen `geohash` generado a partir de lat/lng para indexación espacial.

## Instalación del SDK

```bash
# Mobile (React Native)
yarn add @react-native-firebase/functions
yarn add @react-native-firebase/storage

# Dashboard (Web)
yarn add firebase
```

## Inicialización

```ts
import {getFunctions, httpsCallable} from "firebase/functions";

const functions = getFunctions();
```

## Arquitectura de datos

| Datos | Base | Motivo |
|-------|------|--------|
| `users` | **Firestore** | Perfiles, consultas complejas, no cambian constantemente |
| `reports` | **Realtime Database** | Actualización en tiempo real estilo Waze |
| `confirmations` | **Realtime Database** | Tiempo real |
| `analytics` | **Realtime Database** | Contadores en tiempo real |
| Fotos | **Storage** | Archivos binarios (`reports/{userId}/`) |

---

## Reportes

### `createReport`

Crea un nuevo reporte de barrera de accesibilidad. Las fotos se suben primero a Storage y se envía la URL.

**Flujo recomendado:**
1. Subir foto a `Storage` → obtener `photoUrl`
2. Llamar `createReport(...)` con los datos de ubicación y foto
3. `createReport` ejecuta internamente anti-spam + clasificación Gemini Vision

```ts
const createReport = httpsCallable(functions, "createReport");

const result = await createReport({
  type: "blocked_ramp",
  severity: 8,
  description: "Rampa completamente bloqueada por escombros",
  photoUrl: "https://firebasestorage.googleapis.com/...",
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
| `reporterMobilityProfile` | `MobilityProfile` | No | Perfil de movilidad del reportero (da peso diferenciado al reporte) |

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
    "geohash": "9mudtzs",
    "verified": false,
    "confirmations": 0,
    "rejections": 0,
    "status": "pending",
    "createdAt": 1740000000000
  }
}
```

> El campo `geohash` se genera automáticamente a partir de `latitude` y `longitude` con precisión 7 para indexación espacial en RTDB.

**Errores:**
- `unauthenticated` — usuario no autenticado
- `invalid-argument` — datos inválidos (lat, lng, tipo)
- `failed-precondition` — la imagen no parece mostrar una barrera válida
- `resource-exhausted` — excedió límite de 10 reportes/día

---

### `confirmReport`

Confirma que un reporte es real. La votación es **atómica e idempotente**: usa una clave determinista `{reportId}_{userId}` en vez de `push()`, lo que garantiza que un mismo usuario no pueda emitir votos duplicados incluso bajo requests concurrentes.

Además, si el usuario ya había rechazado el reporte, llamar a `confirmReport` **cambia su voto** de rechazo a confirmación, ajustando los contadores en ambos sentidos.

```ts
const confirmReport = httpsCallable(functions, "confirmReport");
const result = await confirmReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a confirmar |

**Errores:** `not-found`, `already-exists` (si ya tiene un voto de confirmación activo)

**Notas de implementación:**
- La clave del voto en RTDB es `confirmations/{reportId}_{userId}`.
- Si el voto previo era un rechazo, se incrementa `confirmations` y se decrementa `rejections` en el reporte.
- Dos requests concurrentes del mismo usuario no pueden duplicar el voto gracias a que la clave es determinista.

---

### `rejectReport`

Rechaza un reporte (indica que no es real o ya fue solucionado). Mismo comportamiento atómico e idempotente que `confirmReport`. Si el usuario ya había confirmado, su voto cambia a rechazo.

```ts
const rejectReport = httpsCallable(functions, "rejectReport");
const result = await rejectReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a rechazar |

**Errores:** `not-found`, `already-exists` (si ya tiene un voto de rechazo activo)

---

### `archiveReport`

Archiva un reporte. **Requiere rol `moderator` o superior.** Acepta una razón de archivado para distinguir entre reparado, duplicado o inválido. Si el motivo es `fixed`, además guarda `resolvedAt`.

```ts
const archiveReport = httpsCallable(functions, "archiveReport");
const result = await archiveReport({
  reportId: "-OABC123XYZ",
  reason: "fixed",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a archivar |
| `reason` | `ArchiveReason` | No | Motivo recomendado: `fixed`, `duplicate`, `invalid`, `other` |
| `archiveReason` | `ArchiveReason` | No | Alias compatible del campo `reason` |

**Respuesta:**
```json
{
  "success": true,
  "report": {
    "id": "-OABC123XYZ",
    "status": "archived",
    "archiveReason": "fixed",
    "resolvedAt": 1740000000000,
    "updatedAt": 1740000000000
  }
}
```

**Errores:** `permission-denied`

---

### `getMyReports`

Lista todos los reportes del usuario autenticado, ordenados del más reciente al más antiguo.

```ts
const getMyReports = httpsCallable(functions, "getMyReports");
const result = await getMyReports();
```

**Respuesta:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "-OABC123XYZ",
      "userId": "abc123",
      "type": "blocked_ramp",
      "severity": 8,
      "description": "Rampa bloqueada",
      "latitude": 32.5149,
      "longitude": -117.0382,
      "status": "pending",
      "createdAt": 1740000000000
    }
  ]
}
```

---

### `deleteMyReport`

Elimina un reporte del usuario autenticado. Solo el creador puede eliminar sus propios reportes. También elimina todos los comentarios, confirmaciones, **la foto en Firebase Storage** (evitando archivos huérfanos), y decrementa el contador `reportCount` del usuario en Firestore.

```ts
const deleteMyReport = httpsCallable(functions, "deleteMyReport");
const result = await deleteMyReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a eliminar |

**Errores:** `not-found`, `permission-denied` (si no es el creador)

---

## Comentarios

Los comentarios se almacenan en Realtime Database bajo el nodo `comments`. Cualquier usuario autenticado puede comentar en cualquier reporte. Los reportes NO pueden ser modificados por nadie, pero sí pueden recibir comentarios.

### `addComment`

Agrega un comentario a un reporte.

```ts
const addComment = httpsCallable(functions, "addComment");
const result = await addComment({
  reportId: "-OABC123XYZ",
  text: "Sigue igual desde hace 3 meses, nadie ha hecho nada."
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte |
| `text` | `string` | Sí | Texto del comentario (máx. 1000 caracteres) |

**Respuesta:**
```json
{
  "success": true,
  "comment": {
    "id": "-ODEF456ABC",
    "reportId": "-OABC123XYZ",
    "userId": "abc123",
    "displayName": "Ángel Alcántara",
    "text": "Sigue igual desde hace 3 meses...",
    "createdAt": 1740000000000
  }
}
```

---

### `getReportComments`

Obtiene todos los comentarios de un reporte, ordenados del más antiguo al más reciente.

```ts
const getReportComments = httpsCallable(functions, "getReportComments");
const result = await getReportComments({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte |

**Respuesta:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "-ODEF456ABC",
      "reportId": "-OABC123XYZ",
      "userId": "abc123",
      "displayName": "Ángel Alcántara",
      "text": "Ya lo reporté también.",
      "createdAt": 1740000000000
    }
  ]
}
```

---

### `deleteComment`

Elimina un comentario. Solo puede eliminar el autor del comentario, o un moderador/oficial.

```ts
const deleteComment = httpsCallable(functions, "deleteComment");
const result = await deleteComment({commentId: "-ODEF456ABC"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `commentId` | `string` | Sí | ID del comentario a eliminar |

**Errores:** `not-found`, `permission-denied`

---

## Ruteo y mapa

### `getReportsInArea`

Obtiene reportes activos dentro de un bounding box geográfico. Diseñado para el mapa móvil: solo carga los reportes visibles en pantalla. Excluye automáticamente los archivados.

**Optimización con geohash:** en vez de cargar todos los reportes (full scan), la función calcula los prefijos geohash que cubren el bounding box y consulta únicamente los reportes en esas celdas vía `orderByChild("geohash")`, filtrando por precisión de bbox en memoria. Para áreas muy grandes (>15 celdas) hace fallback a carga completa.

```ts
const getReportsInArea = httpsCallable(functions, "getReportsInArea");
const result = await getReportsInArea({
  north: 32.5350,
  south: 32.5100,
  east: -117.0100,
  west: -117.0450,
  // status: "pending"  // opcional: filtrar por estado
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `north` | `number` | Sí | Latitud norte (máxima) |
| `south` | `number` | Sí | Latitud sur (mínima) |
| `east` | `number` | Sí | Longitud este (máxima) |
| `west` | `number` | Sí | Longitud oeste (mínima) |
| `status` | `string` | No | Filtrar por estado (`pending`, `verified`, etc.) |

**Respuesta:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "-OABC123XYZ",
      "userId": "abc123",
      "type": "blocked_ramp",
      "severity": 8,
      "latitude": 32.5149,
      "longitude": -117.0382,
      "status": "pending"
    }
  ]
}
```

---

### `generateAccessibleRoute`

**Función principal del proyecto.** Toma origen y destino, obtiene el perfil de movilidad del usuario desde Firestore, consulta barreras activas en RTDB, calcula una ruta peatonal vía OSRM y determina qué barreras afectan al usuario según su perfil de movilidad.

El `accessibilityScore` es de 1 a 10: 10 significa ruta completamente libre de barreras, valores bajos indican muchas barreras críticas en el camino.

```ts
const generateAccessibleRoute = httpsCallable(functions, "generateAccessibleRoute");

const result = await generateAccessibleRoute({
  originLat: 32.5149,
  originLng: -117.0382,
  destinationLat: 32.5320,
  destinationLng: -117.0181,
  // mobilityProfileOverride: "wheelchair_manual"  // opcional
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `originLat` | `number` | Sí | Latitud de origen |
| `originLng` | `number` | Sí | Longitud de origen |
| `destinationLat` | `number` | Sí | Latitud de destino |
| `destinationLng` | `number` | Sí | Longitud de destino |
| `mobilityProfileOverride` | `string` | No | Perfil de movilidad forzado (sin este, usa el del usuario autenticado) |

**Notas de implementación:**

- Requiere autenticación.
- Si OSRM falla, la función hace fallback a una línea recta entre origen y destino.
- Si el usuario tiene `maxWalkingMeters` en Firestore y la ruta lo excede, la respuesta marca `maxWalkingExceeded: true`.
- Usa consultas con prefijo geohash para cargar solo las barreras en el corredor de la ruta, en vez de todos los reportes.

**Respuesta:**
```json
{
  "success": true,
  "route": {
    "polyline": "}~jaH_pwqU...",
    "distanceMeters": 1240,
    "durationSeconds": 900,
    "warningsOnRoute": [
      {
        "reportId": "-OABC",
        "type": "broken_sidewalk",
        "severity": 7,
        "description": "Banqueta con grietas profundas",
        "lat": 32.516,
        "lng": -117.025
      }
    ],
    "barriersInCorridor": 5,
    "barriersAvoided": 3,
    "accessibilityScore": 7.5,
    "maxWalkingExceeded": false
  }
}
```

**Lógica del penalty por perfil de movilidad:**

| Perfil | Barreras que duplican el penalty |
|--------|----------------------------------|
| `wheelchair_electric` / `wheelchair_manual` | `blocked_ramp`, `no_sidewalk`, `broken_sidewalk` |
| `walker` / `cane` | `broken_sidewalk`, `obstacle` |
| `ambulatory_limited` | `no_sidewalk` |

Cuando `maxWalkingMeters` está configurado y la distancia de la ruta lo excede, `maxWalkingExceeded` se marca como `true`.

---

## Gemini AI (Visión)

Las funciones de Gemini analizan **fotos** (no texto). Reciben una `photoUrl` de Firebase Storage, descargan la imagen y la envían a Gemini 2.0 Flash Vision.

**Requiere:** variable de entorno `GEMINI_API_KEY` configurada con `firebase functions:secrets:set GEMINI_API_KEY`.

---

### `classifyBarrierCallable`

Analiza una foto y devuelve tipo de barrera, severidad, descripción y confianza.

```ts
const classifyBarrier = httpsCallable(functions, "classifyBarrierCallable");

const result = await classifyBarrier({
  photoUrl: "https://firebasestorage.googleapis.com/.../photo.jpg",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `photoUrl` | `string` | Sí | URL pública de la foto en Firebase Storage |

**Respuesta:**
```json
{
  "isBarrier": true,
  "type": "broken_sidewalk",
  "severity": 8,
  "confidence": 0.95,
  "description": "Banqueta con grietas profundas que dificultan el paso de una silla de ruedas."
}
```

Si no detecta barrera:
```json
{
  "isBarrier": false,
  "type": "other",
  "severity": 1,
  "confidence": 1.0,
  "description": "La imagen no muestra una barrera de accesibilidad."
}
```

**Errores:** `internal` (falta GEMINI_API_KEY), `invalid-argument` (falta photoUrl)

---

### `detectSpamCallable`

Filtro anti-spam. Determina si una foto contiene una barrera real o es contenido no válido (selfie, meme, paisaje, animal).

```ts
const detectSpam = httpsCallable(functions, "detectSpamCallable");

const result = await detectSpam({
  photoUrl: "https://firebasestorage.googleapis.com/.../photo.jpg",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `photoUrl` | `string` | Sí | URL pública de la foto en Firebase Storage |

**Respuesta (barrera válida):**
```json
{
  "isBarrier": true,
  "reason": "Se observa una rampa bloqueada por escombros de construcción."
}
```

**Respuesta (spam):**
```json
{
  "isBarrier": false,
  "reason": "La imagen es un paisaje sin ninguna barrera de accesibilidad visible."
}
```

---

### Flujo completo de reporte con IA

`createReport` ya ejecuta internamente `detectSpam` + `classifyBarrier` cuando recibe `photoUrl`. Para cliente, el flujo recomendado es más corto:

```ts
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

// 1. Subir foto a Storage
const storage = getStorage();
const fileRef = ref(storage, `reports/${userId}/${Date.now()}.jpg`);
await uploadBytes(fileRef, imageBlob);
const photoUrl = await getDownloadURL(fileRef);

// 2. Crear reporte
const createReport = httpsCallable(functions, "createReport");
const result = await createReport({
  type: "other",
  photoUrl,
  latitude,
  longitude,
});

// 3. El backend devuelve el reporte ya clasificado por IA
console.log(result.data.report);
```

`detectSpamCallable` y `classifyBarrierCallable` siguen existiendo para pruebas manuales, tooling interno o depuración, pero no son necesarios en el flujo normal de creación de reportes.

---

## Analíticas

### `generateHeatmap`

Genera un mapa de calor por coordenadas. Agrupa reportes activos por proximidad geográfica (radio 250m) y pondera cada punto por cantidad de reportes y severidad promedio. Ideal para renderizar en Google Maps o Leaflet.

Acepta parámetros opcionales de bounding box para filtrar por área y usar consultas geohash indexadas:

```ts
// Mapa de calor global (todos los reportes activos)
const result = await httpsCallable(functions, "generateHeatmap")();

// Mapa de calor filtrado por área visible (usa geohash, más eficiente)
const result = await httpsCallable(functions, "generateHeatmap")({
  north: 32.55,
  south: 32.50,
  east: -116.99,
  west: -117.02,
});
```

**Parámetros opcionales:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `north` | `number` | No | Latitud norte del bounding box |
| `south` | `number` | No | Latitud sur del bounding box |
| `east` | `number` | No | Longitud este del bounding box |
| `west` | `number` | No | Longitud oeste del bounding box |

**Respuesta:**
```json
{
  "heatmap": [
    {"lat": 32.5149, "lng": -117.0382, "weight": 5.6},
    {"lat": 32.5250, "lng": -117.0150, "weight": 3.2},
    {"lat": 32.5000, "lng": -116.9200, "weight": 2.8}
  ]
}
```

### `updateStatistics`

No es una callable function. Es un trigger interno sobre `reports/{reportId}` en Realtime Database que mantiene contadores como:

- `analytics/totalReports`
- `analytics/reportsByDay/{YYYY-MM-DD}`
- `analytics/verifiedReports`

---

## Dashboard

### `getDashboardStats`

Obtiene estadísticas completas. **Requiere rol `moderator` o `official`.** Los usuarios se cuentan desde Firestore.

```ts
const result = await httpsCallable(functions, "getDashboardStats")();
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
      "no_sidewalk": 34
    },
    "recentReports": [...]
  }
}
```

---

### `exportCsv`

Exporta todos los reportes en CSV. **Requiere rol `moderator` o superior.**

```ts
const exportCsv = httpsCallable(functions, "exportCsv");
const result = await exportCsv();

// Descargar como archivo:
const blob = new Blob([result.data.csv], {type: "text/csv"});
const url = URL.createObjectURL(blob);
```

---

## Gestión de Usuarios

Los usuarios se almacenan en **Firestore** (`users/{uid}`). Se sincronizan con Firebase Auth mediante custom claims para los roles.

### `registerUserProfile`

Registra o actualiza el perfil del **usuario autenticado** en Firestore. El `uid` se toma del token de autenticación del servidor — **cualquier `uid` enviado por el cliente es ignorado**.

**Campos administrados por backend** (`role`, `isActive`, `reportCount`, `verifiedReportCount`, `createdAt`, `lastLoginAt`) **no pueden ser modificados** por el cliente. Solo se aceptan los campos editables del perfil de accesibilidad.

```ts
const registerUserProfile = httpsCallable(functions, "registerUserProfile");

// Registro inicial (ciudadano): sin enviar uid
await registerUserProfile({
  displayName: "Ángel Alcántara",
  email: "angel@example.com",
  phoneNumber: "+526641234567",
  edad: 45,
  mobilityProfile: "ambulatory",
  maxWalkingMeters: 500,
  canClimbStairs: true,
  maxStairSteps: 10,
  visionProfile: "normal",
  transportModes: ["walking", "public_transport"],
  needsLowNoise: false,
  emergencyContact: {name: "María Alcántara", phone: "+526641234567"},
  preferredLanguage: "es",
});
```

**Campos editables aceptados:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `displayName` | `string` | No | Nombre visible |
| `phoneNumber` | `string` | No | Teléfono |
| `photoURL` | `string` | No | URL de foto de perfil |
| `edad` | `number` | No | Edad |
| `mobilityProfile` | `MobilityProfile` | No | Perfil de movilidad para ruteo |
| `maxWalkingMeters` | `number` | No | Distancia máxima que puede caminar sin pausa |
| `canClimbStairs` | `boolean` | No | Puede subir escalones |
| `maxStairSteps` | `number` | No | Máximo de escalones (si `canClimbStairs`) |
| `visionProfile` | `VisionProfile` | No | Perfil de visión para ruteo |
| `transportModes` | `string[]` | No | Modos de transporte |
| `needsLowNoise` | `boolean` | No | Evitar zonas ruidosas |
| `emergencyContact` | `{name, phone}` | No | Contacto de emergencia |
| `preferredLanguage` | `Language` | No | Idioma (default: `es`) |

**Respuesta:**
```json
{
  "success": true,
  "user": {
    "uid": "authUid123",
    "displayName": "Ángel Alcántara",
    "email": "angel@example.com",
    "role": "citizen",
    "reportCount": 0,
    "verifiedReportCount": 0
  }
}
```

**Errores:**
- `unauthenticated` — no hay sesión activa
- `invalid-argument` — faltan displayName o email (solo en creación inicial)

---

### `setUserRole`

Cambia el rol de un usuario. **Requiere `moderator` o superior.** Actualiza custom claims y Firestore.

```ts
const setUserRole = httpsCallable(functions, "setUserRole");
await setUserRole({uid: "authUid123", role: "official"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `uid` | `string` | Sí | UID del usuario |
| `role` | `Role` | Sí | Nuevo rol |

---

### `getCurrentUserProfile`

Obtiene el perfil completo del usuario autenticado combinando datos de Firebase Auth y Firestore. Los campos administrados por backend (`role`, `isActive`, `reportCount`, `verifiedReportCount`, `createdAt`, `lastLoginAt`) se obtienen de Firestore y Auth; los campos editables vienen de Firestore.

Si el documento en Firestore no existe aún, devuelve solo los datos de Auth con `fromFirestore: false`.

```ts
const result = await httpsCallable(functions, "getCurrentUserProfile")();
```

**Respuesta (con perfil en Firestore):**
```json
{
  "success": true,
  "user": {
    "uid": "authUid123",
    "displayName": "Ángel Alcántara",
    "email": "angel@example.com",
    "photoURL": "https://...",
    "phoneNumber": "+526641234567",
    "role": "citizen",
    "isActive": true,
    "edad": 45,
    "mobilityProfile": "ambulatory",
    "maxWalkingMeters": 500,
    "canClimbStairs": true,
    "maxStairSteps": 10,
    "visionProfile": "normal",
    "transportModes": ["walking"],
    "needsLowNoise": false,
    "emergencyContact": {"name": "María", "phone": "+52..."},
    "preferredLanguage": "es",
    "reportCount": 12,
    "verifiedReportCount": 9,
    "createdAt": 1740000000000,
    "lastLoginAt": 1740000000000,
    "fromFirestore": true
  }
}
```

---

### Registro y sincronización después del sign-up

El backend incluye un trigger `onUserCreate` que automáticamente siembra un perfil básico en Firestore cuando se crea un usuario en Firebase Auth. Para completar el perfil de accesibilidad, el cliente llama `registerUserProfile` después del sign-in.

```ts
// Mobile: después de sign-in con Google o email, completa el perfil de accesibilidad:

const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  displayName: user.displayName ?? "Usuario",
  email: user.email ?? "",
  mobilityProfile: "wheelchair_manual",
  maxWalkingMeters: 150,
  canClimbStairs: false,
  visionProfile: "low_vision",
  transportModes: ["wheelchair", "adapted_taxi"],
  preferredLanguage: "es",
});
```

---

### `getUsers`

Lista todos los usuarios desde Firestore. **Requiere `moderator` o superior.**

```ts
const result = await httpsCallable(functions, "getUsers")();
```

**Respuesta:**
```json
{
  "users": [
    {
      "uid": "authUid123",
      "displayName": "Ángel Alcántara",
      "email": "angel@example.com",
      "phoneNumber": "+526641234567",
      "photoURL": "https://...",
      "edad": 45,
      "role": "moderator",
      "isActive": true,
      "mobilityProfile": "ambulatory",
      "maxWalkingMeters": 500,
      "canClimbStairs": true,
      "maxStairSteps": 10,
      "visionProfile": "normal",
      "transportModes": ["walking"],
      "needsLowNoise": false,
      "emergencyContact": {"name": "María", "phone": "+52..."},
      "preferredLanguage": "es",
      "reportCount": 12,
      "verifiedReportCount": 9,
      "createdAt": 1740000000000,
      "lastLoginAt": 1740000000000
    }
  ]
}
```

---

### Flujo de registro desde el Dashboard

```ts
import {getAuth, createUserWithEmailAndPassword} from "firebase/auth";
import {getFunctions, httpsCallable} from "firebase/functions";

// 1. Crear usuario en Firebase Auth
const auth = getAuth();
const {user} = await createUserWithEmailAndPassword(auth, email, password);

// 2. La función onUserCreate siembra el perfil automáticamente.
//    Para asignar rol moderator, usa setUserRole:
const setUserRole = httpsCallable(functions, "setUserRole");
await setUserRole({uid: user.uid, role: "moderator"});

// 3. Completar perfil de accesibilidad
const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  displayName,
  email,
  mobilityProfile: "ambulatory",
  maxWalkingMeters: 500,
  canClimbStairs: true,
  visionProfile: "normal",
  transportModes: ["walking"],
  preferredLanguage: "es",
});

// 4. Refrescar token para que los custom claims surtan efecto
await user.getIdToken(true);
```

### Flujo de registro desde Mobile (Google Sign-In)

```ts
import {GoogleAuthProvider, signInWithCredential} from "firebase/auth";

// 1. Login con Google
const credential = GoogleAuthProvider.credential(idToken);
const {user} = await signInWithCredential(auth, credential);

// 2. onUserCreate ya sembró el perfil. Completar accesibilidad:
const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  displayName: user.displayName ?? "Usuario",
  email: user.email ?? "",
  photoURL: user.photoURL ?? undefined,
  edad: 68,
  mobilityProfile: "wheelchair_manual",
  maxWalkingMeters: 150,
  canClimbStairs: false,
  visionProfile: "low_vision",
  transportModes: ["wheelchair", "adapted_taxi"],
  needsLowNoise: true,
  emergencyContact: {name: "María Alcántara", phone: "+526641234567"},
  preferredLanguage: "es",
});
```

---

## Firebase Storage

Las fotos de los reportes se almacenan en:

```
Storage:
  reports/
    {userId}/
      {timestamp}.jpg
```

**Reglas:** solo el dueño puede subir. Cualquier autenticado puede leer. Solo moderator/official pueden borrar.

**Limpieza automática:** cuando un reporte se elimina mediante `deleteMyReport`, la función también elimina la foto asociada en Storage, evitando archivos huérfanos y costo acumulado.

```ts
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

const storage = getStorage();
const path = `reports/${userId}/${Date.now()}.jpg`;
const fileRef = ref(storage, path);
await uploadBytes(fileRef, blob);
const photoUrl = await getDownloadURL(fileRef);
```

---

## Seguridad y reglas

### Firestore (firestore.rules)

- **Solo lectura desde cliente.** Ningún usuario puede escribir directamente en `/users/{userId}`.
- Toda escritura pasa por Cloud Functions (admin SDK), que validan autenticación y campos editables.
- Los campos administrados (`role`, `isActive`, `reportCount`, `verifiedReportCount`) solo pueden ser modificados por el backend.

### Realtime Database (database.rules.json)

- Cliente: solo lectura. Escrituras exclusivamente desde Functions.
- Índices configurados para consultas eficientes:

```json
{
  "reports": { ".indexOn": ["userId", "geohash", "status"] },
  "confirmations": { ".indexOn": ["reportId"] },
  "comments": { ".indexOn": ["reportId"] }
}
```

### Campos editables vs. administrados

| Categoría | Campos | Quién modifica |
|-----------|--------|----------------|
| **Editables** (cliente vía `registerUserProfile`) | `displayName`, `phoneNumber`, `photoURL`, `edad`, `mobilityProfile`, `maxWalkingMeters`, `canClimbStairs`, `maxStairSteps`, `visionProfile`, `transportModes`, `needsLowNoise`, `emergencyContact`, `preferredLanguage` | Usuario autenticado |
| **Admin** (solo backend) | `role`, `isActive`, `reportCount`, `verifiedReportCount`, `createdAt`, `lastLoginAt` | Cloud Functions, `onUserCreate`, `setUserRole` |

---

## Errores comunes

| Código | Significado |
|--------|-------------|
| `unauthenticated` | Inicia sesión antes de llamar esta función |
| `permission-denied` | No tienes el rol necesario (moderator/official) |
| `invalid-argument` | Revisa los parámetros enviados |
| `not-found` | El recurso solicitado no existe |
| `already-exists` | Ya realizaste esta acción sobre este recurso |
| `resource-exhausted` | Excediste el límite de rate limiting (10 reportes/día) |
| `internal` | Error del servidor (posiblemente falta GEMINI_API_KEY) |

---

## Contrato compartido

El tipo `Report` compartido entre `mobile`, `dashboard` y `functions` incluye hoy estos campos adicionales relevantes para mapa y moderación:

- `geohash?: string` — geohash de precisión 7 generado a partir de lat/lng para indexación espacial
- `reporterMobilityProfile?: MobilityProfile`
- `archiveReason?: "fixed" | "duplicate" | "invalid" | "other"`
- `resolvedAt?: number`

## Geohash y consultas geoespaciales

Cada reporte nuevo incluye un campo `geohash` generado al momento de creación con precisión 7 (~150m x 150m por celda). Las funciones que consultan por área geográfica (`getReportsInArea`, `generateHeatmap`, `generateAccessibleRoute`) usan este campo para:

1. Calcular los prefijos geohash que cubren el bounding box solicitado
2. Consultar RTDB con `orderByChild("geohash").startAt(prefix).endAt(prefix + "\uf8ff")` por cada prefijo
3. Filtrar por coordenadas exactas en memoria

Esto evita cargar todos los reportes (full scan), reduciendo latencia, costo y riesgo de timeout con volúmenes reales de datos. Para áreas muy extensas (>15 celdas), la función hace fallback automático a carga completa.

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

---

## Roles (`Role`)

| Valor | Permisos |
|-------|----------|
| `citizen` | Reportar, confirmar, ver mapa, consultar rutas |
| `moderator` | ^ + archivar reportes, gestionar usuarios, exportar CSV |
| `official` | ^ + acceso completo al dashboard, eliminar usuarios |

---

## Perfil de movilidad (`MobilityProfile`)

Define qué tipo de ruta puede hacer el usuario. Reemplaza los antiguos booleans `usaSillaDeRuedas`, `usaBaston`, `necesitaGuia`.

| Valor | Descripción | Implicación en ruteo |
|-------|-------------|---------------------|
| `wheelchair_electric` | Silla de ruedas eléctrica | Requiere rampa con inclinación ≤ 8% |
| `wheelchair_manual` | Silla de ruedas manual | Puede manejar más inclinación, pero menos distancia |
| `walker` | Usa andadera | Requiere superficie plana, no escalones |
| `cane` | Usa bastón | Puede subir escalones con apoyo |
| `ambulatory_limited` | Movilidad reducida sin dispositivo | Distancias cortas, puede necesitar pausas |
| `ambulatory` | Sin limitaciones de movilidad | Ruta estándar |

---

## Perfil de visión (`VisionProfile`)

Reemplaza los antiguos `problemasVision`, `necesitaPerroGuia`.

| Valor | Descripción | Implicación en ruteo |
|-------|-------------|---------------------|
| `normal` | Visión normal | Sin adaptaciones |
| `low_vision` | Baja visión | Priorizar contraste alto, evitar cruces no señalizados |
| `blind` | Ceguera total | Activar audio automático, priorizar guía táctil y braille QR |

---

## Idioma (`Language`)

| Valor | Descripción |
|-------|-------------|
| `es` | Español |
| `en` | Inglés |

---

## Modos de transporte (`transportModes`)

Define qué puede usar el usuario para moverse. Acepta un array con uno o más valores.

| Valor | Descripción |
|-------|-------------|
| `walking` | A pie |
| `wheelchair` | Silla de ruedas (propia) |
| `adapted_taxi` | Taxi adaptado |
| `public_transport` | Transporte público |
