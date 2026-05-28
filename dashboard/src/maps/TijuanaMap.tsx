import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const TIJUANA_CENTER = { lat: 32.5149, lng: -117.0382 }

const mapContainerStyle = {
  width: '100%',
  height: '360px',
  borderRadius: '8px',
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
}

export function TijuanaMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        <p>Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en tu archivo <code>.env</code>.</p>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={TIJUANA_CENTER}
        zoom={12}
        options={mapOptions}
      >
        <Marker position={TIJUANA_CENTER} />
      </GoogleMap>
    </LoadScript>
  )
}
