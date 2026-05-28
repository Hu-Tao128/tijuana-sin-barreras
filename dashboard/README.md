# Dashboard — Tijuana Sin Barreras

Panel web para funcionarios públicos (React + Vite + TypeScript).

## Requisitos

- Node.js LTS
- Variables de entorno (copiar `.env.example` → `.env`)

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Estructura `src/`

| Carpeta | Uso |
|---------|-----|
| `pages/` | Login, Home, HeatMap, Reports, Analytics, Users |
| `components/` | UI compartida (layout, etc.) |
| `services/` | Firebase (Auth, Realtime Database, Storage) |
| `charts/` | Gráficas con Recharts |
| `maps/` | Mapas con `@react-google-maps/api` |

## Dependencias clave

- `firebase` — Auth, Realtime Database, Storage
- `recharts` — estadísticas y tendencias
- `@react-google-maps/api` — mapas y heatmaps
