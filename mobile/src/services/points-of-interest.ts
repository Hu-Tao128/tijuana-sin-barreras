/**
 * services/points-of-interest.ts
 * Lugares importantes en Tijuana para mostrar en el mapa
 * Incluye hospitales, bancos, parques, etc.
 */

export interface POI {
  id: string;
  name: string;
  category: 'hospital' | 'bank' | 'park' | 'government' | 'pharmacy' | 'restaurant';
  latitude: number;
  longitude: number;
  address?: string;
  icon: string; // nombre del ícono de Ionicons
  color: string;
}

export const POINTS_OF_INTEREST: POI[] = [
  // ====== HOSPITALES ======
  {
    id: 'hospital_general_tj',
    name: 'Hospital General Tijuana',
    category: 'hospital',
    latitude: 32.5431,
    longitude: -117.0458,
    address: 'Av. Paseo de los Héroes',
    icon: 'medical',
    color: '#ef4444',
  },
  {
    id: 'hospital_css',
    name: 'Hospital CSS Tijuana',
    category: 'hospital',
    latitude: 32.5084,
    longitude: -117.0384,
    address: 'Centro',
    icon: 'medical',
    color: '#ef4444',
  },
  {
    id: 'imss_hospital',
    name: 'IMSS Hospital Regional',
    category: 'hospital',
    latitude: 32.5223,
    longitude: -116.9847,
    address: 'Rosarito Boulevard',
    icon: 'medical',
    color: '#ef4444',
  },
  {
    id: 'hospital_angeles',
    name: 'Hospital Ángeles Tijuana',
    category: 'hospital',
    latitude: 32.5612,
    longitude: -117.0562,
    address: 'Paseo de los Héroes',
    icon: 'medical',
    color: '#ef4444',
  },
  
  // ====== BANCOS DEL BIENESTAR ======
  {
    id: 'banco_bienestar_centro',
    name: 'Banco del Bienestar - Centro',
    category: 'bank',
    latitude: 32.5141,
    longitude: -117.0378,
    address: 'Avenida Revolución',
    icon: 'cash',
    color: '#3b82f6',
  },
  {
    id: 'banco_bienestar_rosarito',
    name: 'Banco del Bienestar - Zona Centro',
    category: 'bank',
    latitude: 32.5188,
    longitude: -117.0412,
    address: 'Paseo de los Héroes',
    icon: 'cash',
    color: '#3b82f6',
  },
  {
    id: 'banco_bienestar_playas',
    name: 'Banco del Bienestar - Playas',
    category: 'bank',
    latitude: 32.6142,
    longitude: -117.1785,
    address: 'Boulevard Pacífico',
    icon: 'cash',
    color: '#3b82f6',
  },
  
  // ====== FARMACIAS ======
  {
    id: 'farmacia_del_dr_simi_1',
    name: 'Farmacia del Dr. Simi - Centro',
    category: 'pharmacy',
    latitude: 32.5149,
    longitude: -117.0382,
    address: 'Avenida Revolución',
    icon: 'heart',
    color: '#10b981',
  },
  {
    id: 'farmacia_del_dr_simi_2',
    name: 'Farmacia del Dr. Simi - Paseo Héroes',
    category: 'pharmacy',
    latitude: 32.5431,
    longitude: -117.0458,
    address: 'Paseo de los Héroes',
    icon: 'heart',
    color: '#10b981',
  },

  // ====== PARQUES ======
  {
    id: 'parque_ciudadano',
    name: 'Parque Ciudadano',
    category: 'park',
    latitude: 32.5312,
    longitude: -117.0487,
    address: 'Paseo de los Héroes',
    icon: 'leaf',
    color: '#8b5cf6',
  },
  {
    id: 'parque_las_americas',
    name: 'Parque las Américas',
    category: 'park',
    latitude: 32.5167,
    longitude: -117.0314,
    address: 'Zona Centro',
    icon: 'leaf',
    color: '#8b5cf6',
  },
  {
    id: 'parque_morelos',
    name: 'Parque Benito Juárez',
    category: 'park',
    latitude: 32.5211,
    longitude: -117.0445,
    address: 'Centro Histórico',
    icon: 'leaf',
    color: '#8b5cf6',
  },

  // ====== LUGARES DE GOBIERNO ======
  {
    id: 'palacio_municipal',
    name: 'Palacio Municipal de Tijuana',
    category: 'government',
    latitude: 32.5147,
    longitude: -117.0397,
    address: 'Avenida Revolución',
    icon: 'building',
    color: '#f59e0b',
  },
  {
    id: 'delegacion_estatal',
    name: 'Delegación Estatal',
    category: 'government',
    latitude: 32.5178,
    longitude: -117.0428,
    address: 'Paseo de los Héroes',
    icon: 'building',
    color: '#f59e0b',
  },

  // ====== RESTAURANTES POPULARES ======
  {
    id: 'restaurant_cazadores',
    name: 'Cazadores de Tacos',
    category: 'restaurant',
    latitude: 32.5155,
    longitude: -117.0388,
    address: 'Avenida Revolución',
    icon: 'restaurant',
    color: '#ec4899',
  },
  {
    id: 'restaurant_cesar',
    name: 'Ensalada César',
    category: 'restaurant',
    latitude: 32.5149,
    longitude: -117.0395,
    address: 'Avenida Revolución',
    icon: 'restaurant',
    color: '#ec4899',
  },
];

/**
 * Obtiene el ícono apropiado para una categoría
 */
export function getIconForCategory(category: POI['category']): string {
  const iconMap = {
    hospital: 'medical',
    bank: 'cash',
    park: 'leaf',
    government: 'building',
    pharmacy: 'heart',
    restaurant: 'restaurant',
  };
  return iconMap[category] || 'location';
}

/**
 * Obtiene el color para una categoría
 */
export function getColorForCategory(category: POI['category']): string {
  const colorMap = {
    hospital: '#ef4444',
    bank: '#3b82f6',
    park: '#8b5cf6',
    government: '#f59e0b',
    pharmacy: '#10b981',
    restaurant: '#ec4899',
  };
  return colorMap[category] || '#6b7280';
}

/**
 * Filtra POIs por categoría
 */
export function filterPOIsByCategory(
  category: POI['category'] | 'all'
): POI[] {
  if (category === 'all') return POINTS_OF_INTEREST;
  return POINTS_OF_INTEREST.filter(poi => poi.category === category);
}

/**
 * Obtiene descripción legible de la categoría
 */
export function getCategoryLabel(category: POI['category']): string {
  const labels = {
    hospital: '🏥 Hospital',
    bank: '🏦 Banco',
    park: '🌳 Parque',
    government: '🏛️ Gobierno',
    pharmacy: '💊 Farmacia',
    restaurant: '🍽️ Restaurante',
  };
  return labels[category] || category;
}
