# Callable Functions — Documentación de uso

Todas las cloud functions se invocan como **Callable Functions** de Firebase v2 desde el cliente (mobile o dashboard).

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
- `failed-precondition` — la imagen no parece mostrar una barrera válida
- `resource-exhausted` — excedió límite de 10 reportes/día

---

### `confirmReport`

Confirma que un reporte es real.

```ts
const confirmReport = httpsCallable(functions, "confirmReport");
const result = await confirmReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a confirmar |

**Errores:** `not-found`, `already-exists`

---

### `rejectReport`

Rechaza un reporte (indica que no es real o ya fue solucionado).

```ts
const rejectReport = httpsCallable(functions, "rejectReport");
const result = await rejectReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a rechazar |

---

### `archiveReport`

Archiva un reporte. **Requiere rol `moderator` o superior.** Acepta una razón de archivado para distinguir entre reparado, duplicado o inválido.

```ts
const archiveReport = httpsCallable(functions, "archiveReport");
const result = await archiveReport({
  reportId: "-OABC123XYZ",
  archiveReason: "fixed",
});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a archivar |
| `archiveReason` | `string` | No | Motivo: `fixed` (reparado), `duplicate` (duplicado), `invalid` (inválido), `other` (otro). Default: `other` |

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

Elimina un reporte del usuario autenticado. Solo el creador puede eliminar sus propios reportes. También elimina todos los comentarios y confirmaciones asociados. Decrementa el contador `reportCount` del usuario en Firestore.

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

**Función principal del proyecto.** Toma origen y destino, obtiene el perfil de movilidad del usuario desde Firestore, consulta todas las barreras activas en RTDB, calcula la ruta peatonal vía OSRM y determina qué barreras afectan al usuario según su perfil de movilidad.

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

```ts
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

// 1. Subir foto a Storage
const storage = getStorage();
const fileRef = ref(storage, `reports/${userId}/${Date.now()}.jpg`);
await uploadBytes(fileRef, imageBlob);
const photoUrl = await getDownloadURL(fileRef);

// 2. Verificar que no sea spam
const detectSpam = httpsCallable(functions, "detectSpamCallable");
const spamResult = await detectSpam({photoUrl});

if (!spamResult.data.isBarrier) {
  throw new Error(`Reporte rechazado: ${spamResult.data.reason}`);
}

// 3. Clasificar con Gemini Vision
const classifyBarrier = httpsCallable(functions, "classifyBarrierCallable");
const classification = await classifyBarrier({photoUrl});

// 4. Crear reporte con datos de IA
const createReport = httpsCallable(functions, "createReport");
await createReport({
  type: classification.data.type,
  severity: classification.data.severity,
  description: classification.data.description,
  photoUrl,
  latitude,
  longitude,
});
```

---

## Analíticas

### `generateHeatmap`

Genera un mapa de calor por coordenadas. Agrupa reportes activos por proximidad geográfica (radio 250m) y pondera cada punto por cantidad de reportes y severidad promedio. Ideal para renderizar en Google Maps o Leaflet.

```ts
const result = await httpsCallable(functions, "generateHeatmap")();
```

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

Registra un usuario en Firestore después de crearlo en Firebase Auth. Si se asigna rol distinto a `citizen`, requiere `moderator` o superior. Establece custom claims en Firebase Auth.

El perfil de accesibilidad (`mobilityProfile`, `maxWalkingMeters`, `visionProfile`, etc.) es el corazón del ruteo personalizado: define qué tipo de ruta puede hacer el usuario.

```ts
const registerUserProfile = httpsCallable(functions, "registerUserProfile");

// Dashboard: crear moderador con perfil de accesibilidad
await registerUserProfile({
  uid: "authUid123",
  displayName: "Ángel Alcántara",
  email: "angel@example.com",
  phoneNumber: "+526641234567",
  edad: 45,
  role: "moderator",
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

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `uid` | `string` | Sí | UID de Firebase Auth |
| `displayName` | `string` | Sí | Nombre visible |
| `email` | `string` | Sí | Correo electrónico |
| `phoneNumber` | `string` | No | Teléfono |
| `photoURL` | `string` | No | URL de foto de perfil |
| `edad` | `number` | No | Edad |
| `role` | `Role` | No | Rol (default: `citizen`) |
| `mobilityProfile` | `MobilityProfile` | No | Perfil de movilidad para ruteo |
| `maxWalkingMeters` | `number` | No | Distancia máxima que puede caminar sin pausa |
| `canClimbStairs` | `boolean` | No | Puede subir escalones |
| `maxStairSteps` | `number` | No | Máximo de escalones (si `canClimbStairs`) |
| `visionProfile` | `VisionProfile` | No | Perfil de visión para ruteo |
| `transportModes` | `string[]` | No | Modos de transporte: `walking`, `wheelchair`, `adapted_taxi`, `public_transport` |
| `needsLowNoise` | `boolean` | No | Evitar zonas ruidosas (construcción) |
| `emergencyContact` | `{name, phone}` | No | Contacto de emergencia |
| `preferredLanguage` | `Language` | No | Idioma para instrucciones de audio (default: `es`) |

**Respuesta:**
```json
{
  "success": true,
  "user": {
    "uid": "authUid123",
    "displayName": "Ángel Alcántara",
    "email": "angel@example.com",
    "role": "moderator"
  }
}
```

**Errores:**
- `permission-denied` — intentas asignar rol superior sin ser moderator/official
- `invalid-argument` — faltan uid, displayName o email

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

Obtiene el perfil completo del usuario autenticado combinando datos de Firebase Auth y Firestore.

```ts
const result = await httpsCallable(functions, "getCurrentUserProfile")();
```

**Respuesta:**
```json
{
  "success": true,
  "user": {
    "uid": "authUid123",
    "displayName": "Ángel Alcántara",
    "email": "angel@example.com",
    "photoURL": "https://...",
    "phoneNumber": "+526641234567",
    "emailVerified": true,
    "disabled": false,
    "role": "moderator",
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
    "lastLoginAt": 1740000000000
  }
}
```

> Los campos `mobilityProfile`, `visionProfile`, `transportModes`, `emergencyContact`, `edad`, etc. provienen de Firestore. El trigger automático `onUserCreate` los inicializa como `null` o valores por defecto al momento del registro. El usuario debe actualizar su perfil posteriormente con `registerUserProfile`.

---

### Registro automático al crear cuenta

El proyecto incluye un trigger de Firebase Auth (`onUserCreate`) que automáticamente crea un documento en Firestore `users/{uid}` y asigna el custom claim `role: "citizen"` para cada nuevo usuario registrado. No es necesario llamar `registerUserProfile` inmediatamente después del sign-up — el perfil básico ya existe en Firestore.

```ts
// Mobile: después de sign-in con Google o email, el perfil ya existe en Firestore.
// Solo necesitas completar el perfil de accesibilidad después:

const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  uid: user.uid,
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

// 2. Registrar perfil con rol en Firestore + custom claims
const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  uid: user.uid,
  displayName,
  email,
  role: "moderator",
  mobilityProfile: "ambulatory",
  maxWalkingMeters: 500,
  canClimbStairs: true,
  visionProfile: "normal",
  transportModes: ["walking"],
  preferredLanguage: "es",
});

// 3. Refrescar token para que los custom claims surtan efecto
await user.getIdToken(true);
```

### Flujo de registro desde Mobile (Google Sign-In)

```ts
import {GoogleAuthProvider, signInWithCredential} from "firebase/auth";

// 1. Login con Google
const credential = GoogleAuthProvider.credential(idToken);
const {user} = await signInWithCredential(auth, credential);

// 2. Sincronizar perfil básico (rol citizen por defecto)
const registerUserProfile = httpsCallable(functions, "registerUserProfile");
await registerUserProfile({
  uid: user.uid,
  displayName: user.displayName ?? "Usuario",
  email: user.email ?? "",
  photoURL: user.photoURL ?? undefined,
  role: "citizen",
});

// 3. Después el usuario completa su perfil de accesibilidad
await registerUserProfile({
  uid: user.uid,
  displayName: user.displayName ?? "Usuario",
  email: user.email ?? "",
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

```ts
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

const storage = getStorage();
const path = `reports/${userId}/${Date.now()}.jpg`;
const fileRef = ref(storage, path);
await uploadBytes(fileRef, blob);
const photoUrl = await getDownloadURL(fileRef);
```

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
