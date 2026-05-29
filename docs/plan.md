
TIJUANA SIN BARRERAS
Arquitectura Serverless con Firebase

Nota de vigencia
Este archivo es un documento de planeación inicial y ya no refleja con precisión todo el estado implementado del backend.

- La fuente operativa actual para endpoints y contratos es `docs/callable-functions.md`.
- El backend ya incluye `generateAccessibleRoute`, `getReportsInArea`, `generateHeatmap` por coordenadas, `archiveReport` con motivo, y `updateStatistics` como trigger interno.
- **Mejoras recientes (2026-05):**
  - **Geohash:** indexación espacial para consultas por área sin full scan en `getReportsInArea`, `generateHeatmap` y `generateAccessibleRoute`.
  - **Votaciones atómicas:** `confirmReport` y `rejectReport` usan clave determinista `{reportId}_{userId}` para evitar votos duplicados por condición de carrera. Permiten cambiar voto.
  - **Perfil completo:** `getCurrentUserProfile` devuelve datos de Firestore + Auth. `registerUserProfile` usa `request.auth.uid` del servidor y solo acepta campos editables.
  - **Limpieza Storage:** `deleteMyReport` elimina la foto asociada en Firebase Storage.
  - **Reglas endurecidas:** Firestore solo lectura desde cliente. RTDB con índices `.indexOn` para `userId`, `geohash`, `status`.
  - **onUserCreate:** trigger que siembra automáticamente perfil base en Firestore al crear usuario en Auth.
- No tomes este archivo como inventario exacto de funciones exportadas ni como reflejo exacto de la estructura actual de `functions/` y `shared/`.

Objetivo
Permitir que ciudadanos reporten barreras urbanas y consulten rutas accesibles, mientras que instituciones públicas obtienen información en tiempo real para priorizar mejoras de infraestructura y accesibilidad.

Usuarios del Sistema
Ciudadano
Puede:
Registrarse
Iniciar sesión
Reportar barreras
Confirmar o descartar reportes
Consultar rutas accesibles
Visualizar el mapa
No puede:
Administrar usuarios
Ver estadísticas internas
Acceder al panel administrativo

Moderador
Puede:
Revisar reportes sospechosos
Eliminar reportes falsos
Gestionar incidencias
Validar barreras reportadas

Funcionario Público
Accede mediante Dashboard Web.
Puede:
Consultar métricas
Ver mapas de calor
Ver colonias con más incidencias
Exportar información
Analizar tendencias históricas
No utiliza la aplicación móvil.

Arquitectura General
La solución tendrá tres módulos principales:
Mobile App (React Native)
        │
        ▼
Firebase
(Auth + Database + Storage)
        ▲
        │
Dashboard Web (React)
        │
        ▼
Cloud Functions
        │
        ├── Gemini Vision
        ├── Validaciones
        ├── Roles
        ├── Anti Spam
        ├── Analytics
        └── BigQuery


Monorepo
Todo el proyecto estará en un único repositorio Git.
tijuana-sin-barreras/
│
├── mobile/
│
├── dashboard/
│
├── functions/
│
├── shared/
│
├── docs/
│
├── firebase.json
│
├── .firebaserc
│
└── README.md


¿Por qué Monorepo?
Ventajas:
Un solo repositorio.
Un solo flujo de trabajo.
Un solo control de versiones.
Código compartido.
Menos duplicación de modelos.
Ejemplo:
Report
User
Barrier
Role

se definen una sola vez en:
shared/

y son utilizados por:
mobile/
dashboard/
functions/


Estructura Mobile
Tecnologías:
React Native
TypeScript
React Navigation
Firebase SDK
Google Maps SDK
Estructura:
mobile/
│
├── src/
│
├── navigation/
│
├── screens/
│
│   ├── Home
│   ├── Map
│   ├── Report
│   ├── Route
│   └── Profile
│
├── components/
│
├── hooks/
│
├── services/
│
├── store/
│
├── utils/
│
└── features/
    │
    ├── auth/
    ├── reports/
    ├── routes/
    ├── maps/
    └── accessibility/


Estructura Dashboard
Tecnologías:
React
TypeScript
Vite
Google Maps
BigQuery
Estructura:
dashboard/
│
├── src/
│
├── pages/
│
│   ├── Login
│   ├── Home
│   ├── HeatMap
│   ├── Reports
│   ├── Analytics
│   └── Users
│
├── components/
│
├── services/
│
├── hooks/
│
├── charts/
│
└── maps/


Estructura Functions
Tecnologías:
Firebase Functions
TypeScript
Gemini API
Estructura:
functions/
│
├── src/
│
├── middleware/
│
│   ├── auth.ts
│   ├── roles.ts
│   ├── ratelimit.ts
│   ├── validation.ts
│   └── geohash.ts
│
├── reports/
│
├── gemini/
│
├── analytics/
│
├── dashboard/
│
└── index.ts


Shared
Código compartido por toda la plataforma.
shared/
│
├── types/
│
│   ├── User.ts
│   ├── Report.ts
│   ├── Role.ts
│   └── Route.ts
│
├── constants/
│
└── enums/


Firebase
Servicios utilizados:
Authentication
Métodos:
Google Login
Correo y contraseña (opcional)

Realtime Database
Almacenamiento de:
users
reports
confirmations
analytics


Storage
Almacenamiento de:
fotografías
evidencias


App Check
Protección contra:
Bots
Scripts externos
Clientes falsificados

Seguridad
Middleware Auth
Valida JWT de Firebase.

Middleware Roles
Controla acceso a:
Ciudadano
Moderador
Funcionario


Middleware Validation
Valida:
lat
lng
tipo
foto


Middleware AntiSpam
Valida:
Reportes repetidos
Frecuencia excesiva
Actividad sospechosa

Rate Limiting
Ejemplo:
Máximo 10 reportes por hora

por usuario.

Flujo de Reporte
Usuario
│
├── Toma foto
│
├── Obtiene ubicación
│
└── Envía reporte
        │
        ▼
Firebase Storage
        │
        ▼
Cloud Function
        │
        ├── Auth
        ├── AntiSpam
        ├── Gemini Vision
        │
        ▼
Clasificación automática
        │
        ▼
Realtime Database
        │
        ▼
Actualización en tiempo real


Dashboard Gubernamental
Dirigido a:
Ayuntamiento
Obras Públicas
IMOS
DIF
Moderadores
Funciones:
✅ Heatmaps
✅ Estadísticas
✅ Filtros por colonia
✅ Filtros por fecha
✅ Reportes pendientes
✅ Exportación CSV
✅ Exportación PDF
✅ Tendencias históricas

Despliegue
Mobile
React Native
Salida:
APK Android


Dashboard
React + Vite
Despliegue:
Vercel


Functions
Despliegue:
Firebase Functions


Base de Datos
Firebase Realtime Database


Archivos
Firebase Storage



Distribución Inicial del Equipo
Dev 1: LUIS
Mobile UI
Responsable:
navigation
screens
components
Dev 2 Daniel
Mapas y rutas
Responsable:
features/maps
features/routes


Dev 3: Aya
Backend Firebase
Responsable:
functions
middleware
auth
reports


Dev 4: Mayo
Gemini + Dashboard
Responsable:
gemini
analytics
dashboard


Estrategia Git
Branches principales:
main
develop

Branches de trabajo:
feature/mobile
feature/maps
feature/backend
feature/dashboard

Reglas:
Nadie trabaja directamente sobre main.
Todo pasa por Pull Request.
Todo se integra primero en develop.
Cada integrante es dueño de su módulo principal.

MVP para el Hackathon
Ciudadano
✅ Login Google
✅ Reportar barrera
✅ Foto + GPS
✅ Clasificación automática con Gemini
✅ Mapa en tiempo real
✅ Confirmar reportes
✅ Ruta accesible básica
Funcionario
✅ Dashboard Web
✅ Mapa de calor
✅ Estadísticas básicas
✅ Colonias con más incidencias
✅ Exportación simple
Diferenciador
✅ Actualización en tiempo real estilo Waze
✅ Clasificación automática mediante IA
✅ Enfoque específico en accesibilidad urbana para Tijuana

Dado que las condiciones en Tijuana cambian rápido (debido a baches, construcciones o el clima), los datos oficiales pueden estar desactualizados. Aquí entra el poder de la comunidad:
Geofabrik / OpenStreetMap (OSM): OSM es como la Wikipedia de los mapas. Puedes descargar los datos geográficos específicos de Tijuana gratis. A diferencia de Google Maps, en OSM muchos usuarios ya han mapeado qué calles tienen banquetas (sidewalk=both/left/right) o escaleras públicas (comunes en las colonias de los cerros de Tijuana).
Herramientas de extracción: Puedes usar Overpass Turbo (una herramienta web para filtrar datos de OSM) con un script simple para descargar únicamente las líneas que representen caminos peatonales (footways) o banquetas en el polígono de Tijuana en formato GeoJSON.



Herramientas obligatorias
1. Git
Verificar:
git --version


2. Node.js LTS
Verificar:
node -v
npm -v


3. Yarn
npm install -g yarn

Verificar:
yarn -v


4. Android Studio
Necesario para:
Emulador
SDK Android
ADB
Compilar APK
Descarga:
Android Studio
Verificar:
adb version


5. JDK
React Native actual funciona bien con:
Java 17

Verificar:
java -version


Herramientas Firebase
Firebase CLI
Instalar:
npm install -g firebase-tools

Verificar:
firebase --version

Login:
firebase login


Google Cloud CLI (opcional)
Para BigQuery y administración.

Editor
VS Code
Con extensiones:
ESLint
Prettier
Error Lens
GitLens
Firebase Explorer
React Native Tools
Thunder Client

Para Mobile
Instalar proyecto:
npx @react-native-community/cli init mobile --template react-native-template-typescript

o Expo si deciden simplificar.

Para Dashboard
Crear:
yarn create vite dashboard --template react-ts


Para Functions
Dentro del repo:
firebase init functions

Seleccionar:
TypeScript
ESLint
Yarn


Estructura del monorepo
tijuana-sin-barreras/
│
├── mobile/
│
├── dashboard/
│
├── functions/
│
├── shared/
│
└── docs/


Librerías Mobile
Navegación
yarn add @react-navigation/native


Firebase
yarn add @react-native-firebase/app

yarn add @react-native-firebase/auth

yarn add @react-native-firebase/database

yarn add @react-native-firebase/storage


Mapas
yarn add react-native-maps


Geolocalización
yarn add react-native-geolocation-service


Cámara
yarn add react-native-image-picker


Librerías Dashboard
Firebase
yarn add firebase


Google Maps
yarn add @react-google-maps/api


Gráficas
yarn add recharts


Librerías Functions
Gemini
yarn add @google/genai


Firebase Admin
yarn add firebase-admin


Firebase Functions
yarn add firebase-functions


Configuración compartida
En la raíz del proyecto:
yarn add -D typescript

yarn add -D eslint

yarn add -D prettier


