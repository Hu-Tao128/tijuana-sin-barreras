import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useMemo } from 'react'

const TIJUANA_CENTER = { lat: 32.5149, lng: -117.0382 }

const mapContainerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '8px',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
}

type MapMarker = {
  id: string
  position: { lat: number; lng: number }
}

type TijuanaMapProps = {
  markers?: MapMarker[]
}

export function TijuanaMap({ markers }: TijuanaMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'tsb-google-maps',
    googleMapsApiKey: apiKey ?? '',
  })

  const resolvedMarkers = useMemo(
    () => markers ?? [{ id: 'center', position: TIJUANA_CENTER }],
    [markers],
  )

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        <p>
          Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en tu archivo <code>.env</code>.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="map-placeholder">
        <p>No se pudo cargar Google Maps. Revisa la API key y la conexión.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="map-placeholder">
        <p>Cargando mapa…</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={TIJUANA_CENTER}
      zoom={12}
      options={mapOptions}
    >
      {resolvedMarkers.map((marker) => (
        <Marker key={marker.id} position={marker.position} />
      ))}
    </GoogleMap>
  )
}
