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

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { searchPlaces, getPlaceDetails } from '../../services/google-places-api';
import { generateAccessibleRoute, RouteWarning, AccessibleRouteData } from '../../services/callable-functions';
import {
  calculateAccessibilityScore,
  getRiskColor,
  getRiskLevelDescription,
} from '../../services/RouteAnalyzer';
import { DEFAULT_LOCATION, GOOGLE_PLACES_API_KEY } from '../../services/constants';
import { analyzeRouteWithGemini, type AccessibilityReport as GeminiReport } from '../../services/gemini';

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

interface Coordinate {
  latitude: number;
  longitude: number;
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
  onSearchRoute,
  onSelectOrigin,
  onSelectDestination,
  origin,
  destination,
  apiKey,
}: {
  visible: boolean;
  onClose: () => void;
  onSearchRoute: () => void;
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
      } catch {
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
      } catch {
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
    } catch {
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

            <TouchableOpacity
              style={modalStyles.currentLocationRow}
              onPress={() => selectCurrentLocation('origin')}
            >
              <Ionicons name="locate" size={16} color="#3b82f6" />
              <Text style={modalStyles.currentLocationText}>Usar mi ubicación actual</Text>
            </TouchableOpacity>

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

            <TouchableOpacity
              style={modalStyles.currentLocationRow}
              onPress={() => selectCurrentLocation('destination')}
            >
              <Ionicons name="locate" size={16} color="#3b82f6" />
              <Text style={modalStyles.currentLocationText}>Usar mi ubicación actual</Text>
            </TouchableOpacity>

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

        {/* BOTÓN DE CERRAR / BUSCAR */}
        <TouchableOpacity
          style={modalStyles.closeButton}
          onPress={origin && destination ? onSearchRoute : onClose}
        >
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
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [accessibleRoute, setAccessibleRoute] = useState<AccessibleRouteData | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AccessibleRouteData[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [aiReport, setAiReport] = useState<GeminiReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_LOCATION);

  const mapRef = useRef<MapView | null>(null);
  const cancelRef = useRef(false);

  const allRoutes: AccessibleRouteData[] = accessibleRoute
    ? [accessibleRoute, ...alternativeRoutes]
    : [];
  const currentRoute: AccessibleRouteData | null = allRoutes[selectedRouteIndex] ?? null;
  const hasAlternatives = allRoutes.length > 1;
  const hasNearbyObstacles = currentRoute && currentRoute.warningsOnRoute.length > 0;

  const decodePolyline = (encoded: string): Coordinate[] => {
    if (!encoded) return [];
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

  const routePolyline = currentRoute ? decodePolyline(currentRoute.polyline) : [];

  const selectRoute = useCallback((index: number) => {
    setSelectedRouteIndex(index);
    setAiReport(null);
    const route = allRoutes[index];
    if (route && route.polyline) {
      const decodedCoords = decodePolyline(route.polyline);
      if (decodedCoords.length >= 2) {
        requestAnimationFrame(() => {
          mapRef.current?.fitToCoordinates(decodedCoords, {
            edgePadding: { top: 120, right: 48, bottom: 220, left: 48 },
            animated: true,
          });
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRoutes]);
  const calculateOptimalRoute = useCallback(async () => {
    if (!origin || !destination) return;

    cancelRef.current = false;
    setLoading(true);
    try {
      const result = await generateAccessibleRoute({
        originLat: origin.latitude!,
        originLng: origin.longitude!,
        destinationLat: destination.latitude!,
        destinationLng: destination.longitude!,
      });

      if (cancelRef.current) return;
      
      if (result.success && result.route) {
        setAccessibleRoute(result.route);
        setAlternativeRoutes(result.alternatives ?? []);
        setSelectedRouteIndex(0);

        const decodedCoords = decodePolyline(result.route.polyline);
        const coordinatesToFit = [
          { latitude: origin.latitude!, longitude: origin.longitude! },
          { latitude: destination.latitude!, longitude: destination.longitude! },
          ...decodedCoords,
        ];

        if (coordinatesToFit.length >= 2) {
          requestAnimationFrame(() => {
            mapRef.current?.fitToCoordinates(coordinatesToFit, {
              edgePadding: { top: 120, right: 48, bottom: 220, left: 48 },
              animated: true,
            });
          });
        }

        setSearchModalVisible(false);
      } else if (!cancelRef.current) {
        Alert.alert('Error', 'No se pudieron encontrar rutas accesibles');
      }
    } catch (error: any) {
      if (cancelRef.current) return;
      console.error('Error calculando ruta accesible:', error);
      Alert.alert('Error', 'No se pudo calcular la ruta');
    } finally {
      if (!cancelRef.current) {
        setLoading(false);
      }
    }
  }, [origin, destination]);

  const runAIAnalysis = useCallback(async () => {
    if (!currentRoute) return;

    setAiLoading(true);
    setAiReport(null);
    try {
      const routePoints = decodePolyline(currentRoute.polyline);

      const obstacles = currentRoute.warningsOnRoute.map(w => ({
        reportId: w.reportId,
        latitude: w.lat,
        longitude: w.lng,
        type: w.type,
        severity: String(w.severity),
        distance: 0,
      }));

      const report = await analyzeRouteWithGemini(
        routePoints,
        obstacles,
        currentRoute.distanceMeters,
      );
      setAiReport(report);
    } catch (error: any) {
      console.error('Error en análisis IA:', error);
      Alert.alert('Error IA', 'No se pudo completar el análisis con IA.');
    }
    setAiLoading(false);
  }, [currentRoute]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 8) return 'safe';
    if (score >= 5) return 'partial';
    return 'not_recommended';
  };

  // ... (handleSearchRoute, handleCancel, UI part)

  // Calcular ruta cuando cambien origen/destino
  // NOTA: Ya no se dispara automáticamente. El usuario debe presionar "Buscar Ruta" en el modal.
  const handleSearchRoute = useCallback(() => {
    setSearchModalVisible(false);
    if (origin && destination) {
      setAccessibleRoute(null);
      setAlternativeRoutes([]);
      setSelectedRouteIndex(0);
      setAiReport(null);
      void calculateOptimalRoute();
    }
  }, [origin, destination, calculateOptimalRoute]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    setLoading(false);
    setSearchModalVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
      >
        {userLocation && !origin && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="Mi ubicación"
            pinColor="#22c55e"
          />
        )}
        {origin && (
          <Marker
            coordinate={{ latitude: origin.latitude ?? 0, longitude: origin.longitude ?? 0 }}
            title="Origen"
            pinColor="#10b981"
          />
        )}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude ?? 0, longitude: destination.longitude ?? 0 }}
            title="Destino"
            pinColor="#3b82f6"
          />
        )}
        {routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor={currentRoute ? getRiskColor(getRiskLevel(currentRoute.accessibilityScore)) : '#3b82f6'}
            strokeWidth={4}
          />
        )}
        {currentRoute?.warningsOnRoute.map((obstacle: RouteWarning) => (
          <Marker
            key={obstacle.reportId}
            coordinate={{ latitude: obstacle.lat, longitude: obstacle.lng }}
            title={obstacle.type}
            description={`Severidad: ${obstacle.severity}`}
            pinColor="#ef4444"
          />
        ))}
        </MapView>

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

        <Modal
        visible={loading}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancel}
        >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingScreenText}>Calculando ruta accesible...</Text>
            <TouchableOpacity style={styles.loadingCancelBtn} onPress={handleCancel}>
              <Text style={styles.loadingCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
        </Modal>

        {currentRoute && (
        <View style={styles.routeInfoPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {hasAlternatives && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.routeSelector}
                contentContainerStyle={styles.routeSelectorContent}
              >
                {allRoutes.map((route, idx) => {
                  const isSelected = idx === selectedRouteIndex;
                  const riskColor = getRiskColor(getRiskLevel(route.accessibilityScore));
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.routeTab,
                        isSelected && { backgroundColor: riskColor, borderColor: riskColor },
                      ]}
                      onPress={() => selectRoute(idx)}
                    >
                      <Text
                        style={[
                          styles.routeTabTitle,
                          isSelected && styles.routeTabTitleSelected,
                        ]}
                      >
                        Ruta {idx + 1}
                      </Text>
                      <Text
                        style={[
                          styles.routeTabDetail,
                          isSelected && styles.routeTabDetailSelected,
                        ]}
                      >
                        {formatDistance(route.distanceMeters)} • {(route.accessibilityScore * 10).toFixed(0)}/100
                      </Text>
                      <View style={styles.routeTabBadge}>
                        <Text style={[styles.routeTabBadgeScore, { color: riskColor }]}>
                          {route.warningsOnRoute.length > 0
                            ? `${route.warningsOnRoute.length} ⚠️`
                            : '✅'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <View
              style={[
                styles.accessibilityCard,
                { borderLeftColor: getRiskColor(getRiskLevel(currentRoute.accessibilityScore)) },
              ]}
            >
              <View style={styles.riskHeader}>
                <Text style={[styles.riskLevel, { color: getRiskColor(getRiskLevel(currentRoute.accessibilityScore)) }]}>
                  {getRiskLevelDescription(getRiskLevel(currentRoute.accessibilityScore))}
                </Text>
                <Text style={styles.riskScore}>
                  Score de Accesibilidad: {currentRoute.accessibilityScore}/10
                </Text>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="navigate" size={16} color="#666" />
                  <Text style={styles.detailText}>{formatDistance(currentRoute.distanceMeters)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>{formatDuration(currentRoute.durationSeconds)}</Text>
                </View>
              </View>

              {currentRoute.maxWalkingExceeded && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={16} color="#991b1b" />
                  <Text style={styles.warningText}>
                    Esta ruta excede tu distancia máxima de caminata configurada.
                  </Text>
                </View>
              )}

              <View style={styles.recommendations}>
                <Text style={styles.recommendationText}>
                  Se encontraron {currentRoute.warningsOnRoute.length} barreras en la ruta.
                </Text>
                <Text style={styles.recommendationText}>
                  {currentRoute.barriersAvoided} barreras fueron evitadas en el corredor de búsqueda.
                </Text>
              </View>

              {currentRoute.warningsOnRoute.length > 0 ? (
                !aiReport ? (
                  <TouchableOpacity
                    style={styles.aiButton}
                    onPress={runAIAnalysis}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="#8b5cf6" />
                    ) : (
                      <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                    )}
                    <Text style={styles.aiButtonText}>
                      {aiLoading ? 'Analizando con IA...' : 'Análisis detallado con IA'}
                    </Text>
                  </TouchableOpacity>
                ) : null
              ) : (
                <View style={styles.noDataBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.noDataText}>
                    ¡Ruta despejada! No se detectaron barreras críticas en este trayecto.
                  </Text>
                </View>
              )}
            </View>

            {aiReport && (
              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={18} color="#8b5cf6" />
                  <Text style={styles.aiTitle}>Análisis Experto (IA)</Text>
                  <View style={styles.aiScoreBadge}>
                    <Text style={styles.aiScoreText}>{aiReport.scoreAccesibilidad}</Text>
                    <Text style={styles.aiScoreTotal}>/100</Text>
                  </View>
                </View>
                <Text style={styles.aiResumen}>{aiReport.resumen}</Text>
                {aiReport.recomendaciones.length > 0 && (
                  <View style={styles.aiRecomendaciones}>
                    <Text style={styles.aiSectionTitle}>Recomendaciones:</Text>
                    {aiReport.recomendaciones.map((rec: string, idx: number) => (
                      <View key={idx} style={styles.aiRecomItem}>
                        <Text style={styles.aiRecomBullet}>•</Text>
                        <Text style={styles.aiRecomText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.aiRetryButton} onPress={() => setAiReport(null)}>
                  <Text style={styles.aiRetryText}>Cerrar análisis</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentRoute.warningsOnRoute.length > 0 && (
              <View style={styles.obstaclesSection}>
                <Text style={styles.sectionTitle}>
                  ⚠️ Barreras en el trayecto ({currentRoute.warningsOnRoute.length})
                </Text>
                {currentRoute.warningsOnRoute.map((obstacle: RouteWarning, idx: number) => (
                  <View key={idx} style={styles.obstacleItem}>
                    <View
                      style={[
                        styles.obstacleType,
                        { backgroundColor: obstacle.severity >= 7 ? '#fee2e2' : '#fef3c7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.obstacleTypeText,
                          { color: obstacle.severity >= 7 ? '#991b1b' : '#92400e' },
                        ]}
                      >
                        {obstacle.type}
                      </Text>
                    </View>
                    {obstacle.description && (
                      <Text style={styles.obstacleDistance}>
                        {obstacle.description}
                      </Text>
                    )}
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
        onSearchRoute={handleSearchRoute}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    zIndex: 30,
  },
  loadingCard: {
    minWidth: 220,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingScreenText: { fontSize: 16, fontWeight: '500', color: '#374151' },
  loadingCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  loadingCancelText: { fontSize: 14, fontWeight: '600', color: '#fff' },
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#991b1b',
    flex: 1,
    fontWeight: '500',
  },
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
  noDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 12,
  },
  noDataText: { fontSize: 12, color: '#6b7280', flex: 1, lineHeight: 16 },
  routeSelector: {
    marginBottom: 12,
    maxHeight: 88,
  },
  routeSelectorContent: {
    gap: 8,
    paddingRight: 4,
  },
  routeTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    minWidth: 110,
    alignItems: 'center',
  },
  routeTabTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  routeTabTitleSelected: {
    color: '#fff',
  },
  routeTabDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  routeTabDetailSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  routeTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  routeTabBadgeScore: {
    fontSize: 10,
    fontWeight: '600',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  aiButtonText: { fontSize: 13, fontWeight: '600', color: '#8b5cf6' },
  aiCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: { fontSize: 14, fontWeight: '600', color: '#7c3aed', flex: 1 },
  aiScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiScoreText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  aiScoreTotal: { fontSize: 10, color: '#ddd6fe', marginLeft: 1 },
  aiResumen: { fontSize: 12, color: '#4c1d95', lineHeight: 18, marginBottom: 8 },
  aiRecomendaciones: { marginBottom: 8 },
  aiSectionTitle: { fontSize: 12, fontWeight: '600', color: '#7c3aed', marginBottom: 6 },
  aiRecomItem: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  aiRecomBullet: { fontSize: 12, color: '#a78bfa' },
  aiRecomText: { fontSize: 11, color: '#5b21b6', flex: 1, lineHeight: 16 },
  aiRetryButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  aiRetryText: { fontSize: 11, color: '#a78bfa', fontWeight: '500' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  fieldContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderRadius: 8, gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, color: '#1a1a1a' },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  currentLocationText: { fontSize: 13, fontWeight: '500', color: '#1d4ed8' },
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

