import Config from 'react-native-config';
import { BarrierType } from './types';

export const GOOGLE_MAPS_API: string = Config.GOOGLE_MAPS_API || '';

export const GOOGLE_ROUTES_API_KEY = GOOGLE_MAPS_API;
export const GOOGLE_PLACES_API_KEY = GOOGLE_MAPS_API;

export const GEMINI_API_KEY: string = Config.GEMINI_API_KEY || GOOGLE_MAPS_API;

export const DEFAULT_LOCATION = {
  latitude: 32.5149,
  longitude: -117.0382,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const PLACES_SEARCH_RADIUS = 50000;

export const FIRESTORE_COLLECTIONS = {
  REPORTS: 'reports',
  USERS: 'users',
  POI: 'poi',
};

export const REPORT_TYPES = [
  { id: BarrierType.BROKEN_SIDEWALK, label: 'Banqueta dañada', color: '#ef4444' },
  { id: BarrierType.BLOCKED_RAMP, label: 'Rampa bloqueada', color: '#ef4444' },
  { id: BarrierType.NO_SIDEWALK, label: 'Sin banqueta', color: '#ef4444' },
  { id: BarrierType.CONSTRUCTION, label: 'Construcción', color: '#f59e0b' },
  { id: BarrierType.OBSTACLE, label: 'Obstáculo', color: '#f59e0b' },
  { id: BarrierType.DANGEROUS_CROSSING, label: 'Cruce peligroso', color: '#ef4444' },
  { id: BarrierType.OTHER, label: 'Otro', color: '#6b7280' },
];

export const COLORS = {
  SAFE: '#10b981',
  PARTIAL: '#f59e0b',
  NOT_RECOMMENDED: '#ef4444',
  PRIMARY: '#611232',
  SECONDARY: '#6b7280',
};

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};
