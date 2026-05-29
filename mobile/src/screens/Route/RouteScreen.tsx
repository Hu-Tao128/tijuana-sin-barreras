/**
 * screens/RouteScreen.tsx
 * Pantalla para buscar y analizar rutas accesibles
 * 
 * CARACTERÍSTICAS:
 * ✅ Búsqueda de origen y destino con Google Places API
 * ✅ Cálculo de rutas con Google Routes API
 * ✅ Análisis de obstáculos en la ruta
 * ✅ Recomendaciones de rutas alternativas más accesibles
 * ✅ Visualización en mapa con polylines
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import { searchPlaces, getPlaceDetails } from '../../services/google-places-api';
import { getRoutes } from '../../services/google-routes-api';
import {
  analyzeRoute,
  calculateAccessibilityScore,
  getRiskColor,
  getRiskLevelDescription,
} from '../../services/RouteAnalyzer';
import { DEFAULT_LOCATION, GOOGLE_ROUTES_API_KEY, GOOGLE_PLACES_API_KEY } from '../../services/constants';

const { height } = Dimensions.get('window');

// ===========================
// INTERFACES
// ===========================

interface Place {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  latitude?: number;
  longitude?: number;
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  date: number;
  description?: string;
}

interface RouteStep {
  startLocation: Coordinate;
  endLocation: Coordinate;
  polyline: {
    encodedPolyline: string;
  };
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface AnalysisResult {
  riskLevel: 'safe' | 'partial' | 'not_recommended';
  totalRisks: number;
  nearbyObstacles: any[];
  riskScore: number;
  recommendations: string[];
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ===========================
// COMPONENTE: MODAL DE BÚSQUEDA
// ===========================

const RouteSearchModal = ({
  visible,
  onClose,
  onSelectOrigin,
  onSelectDestination,
  origin,
  destination,
  apiKey,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectOrigin: (place: Place) => void;
  onSelectDestination: (place: Place) => void;
  origin: Place | null;
  destination: Place | null;
  apiKey: string;
}) => {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originPredictions, setOriginPredictions] = useState<any[]>([]);
  const [destPredictions, setDestPredictions] = useState<any[]>([]);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  // Obtener ubicación actual al abrir
  useEffect(() => {
    if (visible) getCurrentPosition();
  }, [visible]);

  const getCurrentPosition = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      Geolocation.getCurrentPosition(
        (position) => setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
        (error) => console.log('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } catch (err) {
      console.log('Error getting location:', err);
    }
  };

  // Buscar lugares con Google Places
  const handleSearch = async (text: string, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOriginQuery(text);
      if (text.length < 2) {
        setOriginPredictions([]);
        return;
      }
      setLoadingOrigin(true);
      try {
        const result = await searchPlaces(text, apiKey, userLocation || undefined);
        if (result.predictions) {
          setOriginPredictions(result.predictions);
        } else if (result.error_message) {
          Alert.alert('Error API', result.error_message);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las predicciones');
      }
      setLoadingOrigin(false);
    } else {
      setDestQuery(text);
      if (text.length < 2) {
        setDestPredictions([]);
        return;
      }
      setLoadingDest(true);
      try {
        const result = await searchPlaces(text, apiKey, userLocation || undefined);
        if (result.predictions) {
          setDestPredictions(result.predictions);
        } else if (result.error_message) {
          Alert.alert('Error API', result.error_message);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las predicciones');
      }
      setLoadingDest(false);
    }
  };

  // Seleccionar lugar de predicción
  const selectPlace = async (prediction: any, type: 'origin' | 'destination') => {
    try {
      const location = await getPlaceDetails(prediction.place_id, apiKey);
      if (!location) {
        Alert.alert('Error', 'No se pudo obtener la ubicación del lugar');
        return;
      }
      
      const place: Place = {
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text,
        latitude: location.lat,
        longitude: location.lng,
      };

      if (type === 'origin') {
        onSelectOrigin(place);
        setOriginQuery(place.mainText);
        setOriginPredictions([]);
      } else {
        onSelectDestination(place);
        setDestQuery(place.mainText);
        setDestPredictions([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al obtener detalles del lugar');
    }
  };

  // Usar ubicación actual
  const selectCurrentLocation = (type: 'origin' | 'destination') => {
    if (!userLocation) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      return;
    }
    const place: Place = {
      placeId: 'current_location',
      description: 'Tu ubicación actual',
      mainText: 'Mi ubicación',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    };
    if (type === 'origin') {
      onSelectOrigin(place);
      setOriginQuery('Mi ubicación');
    } else {
      onSelectDestination(place);
      setDestQuery('Mi ubicación');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Buscar Ruta</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ORIGEN */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionLabel}>📍 Origen</Text>
            <View style={modalStyles.fieldContainer}>
              <TextInput
                style={modalStyles.input}
                placeholder="¿De dónde sales?"
                value={originQuery}
                onChangeText={(text) => handleSearch(text, 'origin')}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => selectCurrentLocation('origin')}>
                <Ionicons name="locate" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {loadingOrigin && <ActivityIndicator size="small" color="#3b82f6" />}

            {originPredictions.length > 0 && (
              <View style={modalStyles.predictionsList}>
                <FlatList
                  data={originPredictions}
                  keyExtractor={(item) => item.place_id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={modalStyles.predictionItem}
                      onPress={() => selectPlace(item, 'origin')}
                    >
                      <Ionicons name="location" size={16} color="#666" />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.predictionMain}>
                          {item.structured_formatting?.main_text || item.description}
                        </Text>
                        <Text style={modalStyles.predictionSecondary}>
                          {item.structured_formatting?.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          {/* DESTINO */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.sectionLabel}>🎯 Destino</Text>
            <View style={modalStyles.fieldContainer}>
              <TextInput
                style={modalStyles.input}
                placeholder="¿A dónde vas?"
                value={destQuery}
                onChangeText={(text) => handleSearch(text, 'destination')}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => selectCurrentLocation('destination')}>
                <Ionicons name="locate" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {loadingDest && <ActivityIndicator size="small" color="#3b82f6" />}

            {destPredictions.length > 0 && (
              <View style={modalStyles.predictionsList}>
                <FlatList
                  data={destPredictions}
                  keyExtractor={(item) => item.place_id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={modalStyles.predictionItem}
                      onPress={() => selectPlace(item, 'destination')}
                    >
                      <Ionicons name="location" size={16} color="#666" />
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.predictionMain}>
                          {item.structured_formatting?.main_text || item.description}
                        </Text>
                        <Text style={modalStyles.predictionSecondary}>
                          {item.structured_formatting?.secondary_text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          {/* MOSTRAR DESTINO SELECCIONADO */}
          {origin && destination && (
            <View style={modalStyles.selectedContainer}>
              <View style={modalStyles.selectedItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={modalStyles.selectedText}>{origin.mainText}</Text>
              </View>
              <View style={modalStyles.arrow}>
                <Ionicons name="arrow-down" size={16} color="#666" />
              </View>
              <View style={modalStyles.selectedItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={modalStyles.selectedText}>{destination.mainText}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTÓN DE CERRAR */}
        <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
          <Text style={modalStyles.closeButtonText}>
            {origin && destination ? 'Buscar Ruta' : 'Cerrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ===========================
// COMPONENTE PRINCIPAL: ROUTESCREEN
// ===========================

export default function RouteScreen() {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_LOCATION);

  // Cargar reportes de Firestore
  useEffect(() => {
    try {
      const reportsRef = firestore().collection('reports');
      const unsubscribe = reportsRef.onSnapshot(
        (snapshot) => {
          const data: Report[] = [];
          snapshot.forEach(doc => {
            const report = doc.data();
            if (report.latitude !== undefined && report.longitude !== undefined) {
              data.push({
                id: doc.id,
                latitude: report.latitude,
                longitude: report.longitude,
                type: report.type || 'Obstáculo',
                severity: report.severity || 'medium',
                date: report.date || Date.now(),
                description: report.description,
              });
            }
          });
          setReports(data);
        },
        (error) => {
          console.error('Error cargando reportes:', error);
          Alert.alert('Error', 'No se pudieron cargar los reportes');
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error('Error en Firestore:', error);
    }
  }, []);

  // Calcular ruta óptima cuando hay origen y destino
  const calculateOptimalRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    try {
      const originCoords = {
        latitude: origin.latitude!,
        longitude: origin.longitude!,
      };
      const destCoords = {
        latitude: destination.latitude!,
        longitude: destination.longitude!,
      };

      const routeData = await getRoutes(originCoords, destCoords, GOOGLE_ROUTES_API_KEY);
      
      if (routeData?.routes?.length) {
        setRoutes(routeData.routes);
        setSelectedRouteIndex(0);

        // Actualizar región del mapa
        setMapRegion({
          latitude: (origin.latitude! + destination.latitude!) / 2,
          longitude: (origin.longitude! + destination.longitude!) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Analizar la ruta principal contra obstáculos
        const mainRoute = routeData.routes[0];
        const steps: RouteStep[] = mainRoute.legs.flatMap((leg: any) => leg.steps);
        const analysis = analyzeRoute(steps, reports);
        setAnalysisResult(analysis);

        Alert.alert('✅ Rutas encontradas', `Se encontraron ${routeData.routes.length} ruta(s) disponibles`);
      } else {
        Alert.alert('Error', 'No se encontraron rutas disponibles');
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
      Alert.alert('Error', 'No se pudo calcular la ruta');
    }
    setLoading(false);
  }, [origin, destination, reports]);

  // Buscar ruta más accesible evitando obstáculos
  const recalculateAvoidingObstacles = useCallback(async () => {
    if (!origin || !destination || !analysisResult) return;

    // Puntos críticos a evitar (obstáculos severos)
    const criticalObstacles = analysisResult.nearbyObstacles
      .filter(o => o.severity === 'high')
      .map(o => ({ latitude: o.latitude, longitude: o.longitude }));

    if (criticalObstacles.length === 0) {
      Alert.alert('Información', 'No hay obstáculos críticos para evitar');
      return;
    }

    setLoading(true);
    try {
      const originCoords = {
        latitude: origin.latitude!,
        longitude: origin.longitude!,
      };
      const destCoords = {
        latitude: destination.latitude!,
        longitude: destination.longitude!,
      };

      const alternativeData = await getRoutes(
        originCoords,
        destCoords,
        GOOGLE_ROUTES_API_KEY,
        criticalObstacles
      );

      if (alternativeData?.routes?.length) {
        setRoutes(alternativeData.routes);
        setSelectedRouteIndex(0);

        // Re-analizar nueva ruta
        const mainRoute = alternativeData.routes[0];
        const steps: RouteStep[] = mainRoute.legs.flatMap((leg: any) => leg.steps);
        const analysis = analyzeRoute(steps, reports);
        setAnalysisResult(analysis);

        Alert.alert('✅ Rutas recalculadas', 'Se encontraron rutas alternativas más accesibles');
      } else {
        Alert.alert('Error', 'No se pudieron recalcular las rutas');
      }
    } catch (error) {
      console.error('Error recalculando:', error);
      Alert.alert('Error', 'Error al recalcular la ruta');
    }
    setLoading(false);
  }, [origin, destination, analysisResult]);

  // Decodificar polyline de Google
  const decodePolyline = (encoded: string): Coordinate[] => {
    const decoded: Coordinate[] = [];
    let index = 0, lat = 0, lng = 0;
    
    while (index < encoded.length) {
      let result = 0, shift = 0, b;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      result = 0;
      shift = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      decoded.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return decoded;
  };

  // Obtener polyline de la ruta actual
  const getCurrentRoutePolyline = useCallback((): Coordinate[] => {
    if (routes.length === 0 || selectedRouteIndex >= routes.length) return [];
    
    const steps = routes[selectedRouteIndex].legs.flatMap((leg: any) => leg.steps);
    const coordinates: Coordinate[] = [];
    
    for (const step of steps) {
      if (step.polyline?.encodedPolyline) {
        try {
          coordinates.push(...decodePolyline(step.polyline.encodedPolyline));
        } catch (e) {
          console.log('Error decodificando polyline:', e);
        }
      }
    }
    return coordinates;
  }, [routes, selectedRouteIndex]);

  // Obtener info de la ruta
  const getRouteInfo = useCallback(() => {
    if (routes.length === 0 || selectedRouteIndex >= routes.length) return null;
    const leg = routes[selectedRouteIndex].legs[0];
    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
    };
  }, [routes, selectedRouteIndex]);

  const routePolyline = getCurrentRoutePolyline();
  const routeInfo = getRouteInfo();

  // Calcular ruta cuando cambien origen/destino
  useEffect(() => {
    if (origin && destination) {
      calculateOptimalRoute();
    }
  }, [origin, destination, calculateOptimalRoute]);

  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
      >
        {/* Marcador de origen */}
        {origin && (
          <Marker
            coordinate={{ latitude: origin.latitude ?? 0, longitude: origin.longitude ?? 0 }}
            title="Origen"
            pinColor="#10b981"
          />
        )}

        {/* Marcador de destino */}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude ?? 0, longitude: destination.longitude ?? 0 }}
            title="Destino"
            pinColor="#3b82f6"
          />
        )}

        {/* Polyline de la ruta */}
        {routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor={analysisResult ? getRiskColor(analysisResult.riskLevel) : '#3b82f6'}
            strokeWidth={4}
          />
        )}

        {/* Marcadores de obstáculos en la ruta */}
        {analysisResult?.nearbyObstacles.map((obstacle: any) => (
          <Marker
            key={obstacle.reportId}
            coordinate={{ latitude: obstacle.latitude, longitude: obstacle.longitude }}
            title={obstacle.type}
            description={`Severidad: ${obstacle.severity}`}
            pinColor="#ef4444"
          />
        ))}
      </MapView>

      {/* BOTÓN DE BÚSQUEDA */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setSearchModalVisible(true)}
        >
          <Ionicons name="search" size={20} color="#1a1a1a" />
          <Text style={styles.searchButtonText}>
            {origin && destination
              ? `${origin.mainText} → ${destination.mainText}`
              : 'Buscar ruta'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PANEL DE INFORMACIÓN DE RUTA */}
      {routeInfo && analysisResult && (
        <View style={styles.routeInfoPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ACCESIBILIDAD */}
            <View
              style={[
                styles.accessibilityCard,
                { borderLeftColor: getRiskColor(analysisResult.riskLevel) },
              ]}
            >
              <View style={styles.riskHeader}>
                <Text
                  style={[
                    styles.riskLevel,
                    { color: getRiskColor(analysisResult.riskLevel) },
                  ]}
                >
                  {getRiskLevelDescription(analysisResult.riskLevel)}
                </Text>
                <Text style={styles.riskScore}>
                  Accesibilidad: {calculateAccessibilityScore(analysisResult)}%
                </Text>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="navigate" size={16} color="#666" />
                  <Text style={styles.detailText}>{routeInfo.distance}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>{routeInfo.duration}</Text>
                </View>
              </View>

              {/* RECOMENDACIONES */}
              <View style={styles.recommendations}>
                {analysisResult.recommendations.map((rec: string, idx: number) => (
                  <Text key={idx} style={styles.recommendationText}>
                    {rec}
                  </Text>
                ))}
              </View>

              {/* BOTÓN RECALCULAR */}
              {analysisResult.riskLevel !== 'safe' && (
                <TouchableOpacity
                  style={styles.recalculateButton}
                  onPress={recalculateAvoidingObstacles}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={styles.recalculateButtonText}>
                        Buscar ruta más accesible
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* OBSTÁCULOS DETECTADOS */}
            {analysisResult.nearbyObstacles.length > 0 && (
              <View style={styles.obstaclesSection}>
                <Text style={styles.sectionTitle}>
                  ⚠️ Obstáculos detectados ({analysisResult.nearbyObstacles.length})
                </Text>
                {analysisResult.nearbyObstacles.map((obstacle: any, idx: number) => (
                  <View key={idx} style={styles.obstacleItem}>
                    <View
                      style={[
                        styles.obstacleType,
                        {
                          backgroundColor:
                            obstacle.severity === 'high' ? '#fee2e2' : '#fef3c7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.obstacleTypeText,
                          {
                            color:
                              obstacle.severity === 'high'
                                ? '#991b1b'
                                : '#92400e',
                          },
                        ]}
                      >
                        {obstacle.type}
                      </Text>
                    </View>
                    <Text style={styles.obstacleDistance}>
                      A {obstacle.distance}m de la ruta
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* MODAL DE BÚSQUEDA */}
      <RouteSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectOrigin={setOrigin}
        onSelectDestination={setDestination}
        origin={origin}
        destination={destination}
        apiKey={GOOGLE_PLACES_API_KEY}
      />
    </View>
  );
}

// ===========================
// ESTILOS
// ===========================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  controlPanel: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  searchButtonText: { fontSize: 14, color: '#666', flex: 1 },
  routeInfoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.35,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  accessibilityCard: {
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  riskHeader: { marginBottom: 8 },
  riskLevel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  riskScore: { fontSize: 12, color: '#666' },
  routeDetails: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#666' },
  recommendations: { marginBottom: 12 },
  recommendationText: { fontSize: 12, color: '#1a1a1a', marginBottom: 4, lineHeight: 16 },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    gap: 6,
  },
  recalculateButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  obstaclesSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  obstacleItem: { marginBottom: 8 },
  obstacleType: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4, alignSelf: 'flex-start' },
  obstacleTypeText: { fontSize: 11, fontWeight: '500' },
  obstacleDistance: { fontSize: 12, color: '#666' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  fieldContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 8, gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, color: '#1a1a1a' },
  predictionsList: { maxHeight: 200, marginTop: 8, backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' },
  predictionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  predictionMain: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  predictionSecondary: { fontSize: 12, color: '#666', marginTop: 2 },
  selectedContainer: { backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 24 },
  selectedItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { alignItems: 'center', marginVertical: 8 },
  selectedText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  closeButton: { paddingVertical: 12, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center', marginTop: 24 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
