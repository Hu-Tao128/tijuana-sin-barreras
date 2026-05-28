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
2. Llamar `classifyBarrierCallable(photoUrl)` → obtener `type`, `severity`, `description`
3. Llamar `detectSpamCallable(photoUrl)` → verificar que no sea basura
4. Llamar `createReport(...)` con los datos completos

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

Archiva un reporte. **Requiere rol `moderator` o superior.**

```ts
const archiveReport = httpsCallable(functions, "archiveReport");
const result = await archiveReport({reportId: "-OABC123XYZ"});
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reportId` | `string` | Sí | ID del reporte a archivar |

**Errores:** `permission-denied`

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

Genera un mapa de calor agrupando reportes por zona de Tijuana.

```ts
const result = await httpsCallable(functions, "generateHeatmap")();
```

**Respuesta:**
```json
{
  "heatmap": [
    {"zone": "Zona Río", "count": 87},
    {"zone": "Centro", "count": 45},
    {"zone": "Otay", "count": 32},
    {"zone": "La Mesa", "count": 28},
    {"zone": "Playas de Tijuana", "count": 15},
    {"zone": "Otra zona", "count": 12}
  ]
}
```

---

## Dashboard

### `getDashboardStats`

Obtiene estadísticas completas. **Requiere autenticación (cualquier rol).** Los usuarios se cuentan desde Firestore.

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

```ts
const registerUserProfile = httpsCallable(functions, "registerUserProfile");

// Dashboard: crear moderador con datos de accesibilidad
await registerUserProfile({
  uid: "authUid123",
  displayName: "Ángel Alcántara",
  email: "angel@example.com",
  phoneNumber: "+526641234567",
  edad: 45,
  role: "moderator",
  usaSillaDeRuedas: false,
  usaBaston: false,
  problemasVision: false,
  necesitaPerroGuia: false,
  necesitaGuia: false,
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
| `edad` | `number` | No | Edad (para identificar adulto mayor) |
| `role` | `Role` | No | Rol (default: `citizen`) |
| `usaSillaDeRuedas` | `boolean` | No | Usa silla de ruedas |
| `usaBaston` | `boolean` | No | Usa bastón |
| `problemasVision` | `boolean` | No | Discapacidad visual |
| `necesitaPerroGuia` | `boolean` | No | Necesita perro guía |
| `necesitaGuia` | `boolean` | No | Necesita persona que lo guíe |

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

Obtiene el perfil del usuario autenticado desde Firebase Auth (sin consultar Firestore).

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
    "role": "moderator"
  }
}
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
      "usaSillaDeRuedas": false,
      "usaBaston": false,
      "problemasVision": false,
      "necesitaPerroGuia": false,
      "necesitaGuia": false,
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
  usaSillaDeRuedas: false,
  usaBaston: false,
  problemasVision: false,
  necesitaPerroGuia: false,
  necesitaGuia: false,
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

// 3. Después el usuario puede completar datos de accesibilidad
//    llamando a registerUserProfile de nuevo con los campos adicionales
await registerUserProfile({
  uid: user.uid,
  displayName: user.displayName ?? "Usuario",
  email: user.email ?? "",
  edad: 68,
  usaSillaDeRuedas: true,
  usaBaston: false,
  problemasVision: false,
  necesitaPerroGuia: false,
  necesitaGuia: true,
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
