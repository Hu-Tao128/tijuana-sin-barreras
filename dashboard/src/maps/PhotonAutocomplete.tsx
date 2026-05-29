import { useEffect, useRef, useState } from 'react'

export type PlaceResult = {
  lat: number
  lng: number
  label: string
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}

const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/'

// Sesgo de resultados hacia Tijuana.
const BIAS = { lat: 32.5149, lon: -117.0382 }

function buildLabel(props: PhotonFeature['properties']): string {
  return [props.name, props.street, props.city, props.state]
    .filter(Boolean)
    .join(', ')
}

type PhotonAutocompleteProps = {
  placeholder?: string
  onSelect: (place: PlaceResult) => void
}

export function PhotonAutocomplete({ placeholder, onSelect }: PhotonAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // Evita que la selección dispare una nueva búsqueda.
  const skipNextSearch = useRef(false)

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(trimmed)}&limit=5&lang=default&lat=${BIAS.lat}&lon=${BIAS.lon}`
        const response = await fetch(url, { signal: controller.signal })
        const data = (await response.json()) as { features?: PhotonFeature[] }
        setResults(data.features ?? [])
        setOpen(true)
      } catch {
        // Petición abortada o error de red: ignoramos.
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(feature: PhotonFeature) {
    const [lng, lat] = feature.geometry.coordinates
    const label = buildLabel(feature.properties)
    skipNextSearch.current = true
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect({ lat, lng, label })
  }

  return (
    <div className="photon-autocomplete" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (results.length > 0 || loading) && (
        <ul className="photon-autocomplete__list">
          {loading && <li className="photon-autocomplete__loading">Buscando…</li>}
          {results.map((feature, index) => (
            <li key={`${feature.geometry.coordinates.join(',')}-${index}`}>
              <button type="button" onClick={() => handleSelect(feature)}>
                {buildLabel(feature.properties)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
