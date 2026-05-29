import { useState } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './LocationPickerModal.css'

const TIJUANA_CENTER: [number, number] = [32.5149, -117.0382]

type LatLng = { lat: number; lng: number }

function ClickCapture({ onPick }: { onPick: (pos: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

type LocationPickerModalProps = {
  initial?: LatLng
  onConfirm: (pos: LatLng) => void
  onClose: () => void
}

export function LocationPickerModal({ initial, onConfirm, onClose }: LocationPickerModalProps) {
  const [selected, setSelected] = useState<LatLng | null>(initial ?? null)
  const center = initial ? [initial.lat, initial.lng] : TIJUANA_CENTER

  return (
    <div className="location-picker" role="dialog" aria-label="Seleccionar ubicación" aria-modal="true">
      <div className="location-picker__backdrop" onClick={onClose} />
      <div className="location-picker__dialog">
        <div className="location-picker__head">
          <p className="location-picker__title">Elige la ubicación en el mapa</p>
          <button
            type="button"
            className="location-picker__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="location-picker__hint">Haz clic en el mapa para colocar el punto del reporte.</p>

        <MapContainer center={center as [number, number]} zoom={13} className="location-picker__map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCapture onPick={setSelected} />
          {selected && (
            <CircleMarker
              center={[selected.lat, selected.lng]}
              radius={9}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#9B2247', fillOpacity: 1 }}
            />
          )}
        </MapContainer>

        <div className="location-picker__footer">
          <span className="location-picker__coords">
            {selected
              ? `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}`
              : 'Sin ubicación seleccionada'}
          </span>
          <div className="location-picker__actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={!selected}
              onClick={() => selected && onConfirm(selected)}
            >
              Usar esta ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
