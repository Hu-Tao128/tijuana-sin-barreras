import { TijuanaMap } from '../../maps'
import '../../App.css'

export function Mapa() {
  return (
    <article className="dashboard-card dashboard-card--wide">
      {/* Sección de leyendas: preparada para describir los elementos del mapa.
          Pendiente de definir los íconos/colores y su significado. */}
      <div className="map-legend" aria-label="Leyendas del mapa">
        {/* TODO: agregar leyendas (colores, marcadores, niveles de severidad, etc.) */}
      </div>
      <TijuanaMap />
    </article>
  )
}
