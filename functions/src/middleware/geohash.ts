const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const DEFAULT_PRECISION = 7;

interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

function encode(lat: number, lng: number, precision: number = DEFAULT_PRECISION): string {
  let geohash = "";
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let even = true;
  let bit = 16;
  let ch = 0;

  while (geohash.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= bit;
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= bit;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    even = !even;
    if (bit === 1) {
      geohash += BASE32[ch];
      bit = 16;
      ch = 0;
    } else {
      bit >>= 1;
    }
  }

  return geohash;
}

function bboxCovering(
  north: number,
  south: number,
  east: number,
  west: number,
  precision: number = DEFAULT_PRECISION
): string[] {
  const geohashes = new Set<string>();

  const latStep = 180 / (1 << Math.floor((precision * 5) / 2));
  const lngStep = 360 / (1 << Math.floor((precision * 5 + 1) / 2));

  for (let lat = south; lat <= north; lat += latStep * 0.5) {
    for (let lng = west; lng <= east; lng += lngStep * 0.5) {
      const clampedLat = Math.max(-90, Math.min(90, lat));
      const clampedLng = Math.max(-180, Math.min(180, lng));
      geohashes.add(encode(clampedLat, clampedLng, precision));
    }
  }

  geohashes.add(encode(north, west, precision));
  geohashes.add(encode(north, east, precision));
  geohashes.add(encode(south, west, precision));
  geohashes.add(encode(south, east, precision));

  return [...geohashes];
}

function bboxCoveringPrefixes(bounds: GeoBounds, precision: number = DEFAULT_PRECISION): string[] {
  return bboxCovering(bounds.north, bounds.south, bounds.east, bounds.west, precision);
}

export {encode, bboxCoveringPrefixes, DEFAULT_PRECISION};
export type {GeoBounds};
