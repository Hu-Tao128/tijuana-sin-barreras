/**
 * screens/MapScreen.tsx
 * Mapa principal con:
 * - Reportes de obstáculos
 * - Puntos de interés (hospitales, bancos, etc.)
 * - Ubicación del usuario
 * - Menú hamburguesa con leyenda y controles de capas
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  Switch,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Ionicons from 'react-native-vector-icons/Ionicons';
import database from '@react-native-firebase/database';
import { DEFAULT_LOCATION } from '../../services/constants';
import { POINTS_OF_INTEREST, getColorForCategory, getCategoryLabel } from '../../services/points-of-interest';
import LocationPermissionModal from '../../components/LocationPermissionModal';

const { width } = Dimensions.get('window');

interface Report {
  id: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  severity?: 'low' | 'medium' | 'high';
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type POICategory = 'all' | 'hospital' | 'bank' | 'park' | 'government' | 'pharmacy' | 'restaurant';

export default function MapScreen() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPOICategory, setSelectedPOICategory] = useState<POICategory>('all');
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_LOCATION);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Estados para control de capas
  const [showReports, setShowReports] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // =========================
  // PERMISOS
  // =========================
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'Esta aplicación necesita acceso a tu ubicación para mostrarte en el mapa.',
          buttonNeutral: 'Preguntar Después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.log('Permission Error:', error);
      return false;
    }
  };

  // =========================
  // UBICACION
  // =========================
  const getUserLocation = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Permiso denegado - usando ubicación por defecto');
      setLocation({
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
      });
      setLocationEnabled(false);
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        console.log('✅ Ubicación obtenida:', position.coords);
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMapRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
        setLocationEnabled(true);
        setShowLocationModal(false);
        setLoading(false);
      },
      error => {
        console.log('❌ Location Error:', error);
        if (error.code === 2 || error.message?.includes('disabled')) {
          setLocationEnabled(false);
          setShowLocationModal(true);
        } else {
          setLocation({
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
          });
          setLocationEnabled(false);
          setLoading(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceLocationManager: true,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );
  }, []);

  const handleActivateLocation = () => {
    if (Platform.OS === 'android') Linking.openSettings();
    setShowLocationModal(false);
  };

  const handleCancelLocation = () => {
    setLocation({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    });
    setLocationEnabled(false);
    setShowLocationModal(false);
    setLoading(false);
  };

  // =========================
  // FIREBASE - CARGAR REPORTES
  // =========================
  useEffect(() => {
    getUserLocation();
    try {
      const reportsRef = database().ref('reports');
      const unsubscribe = reportsRef.on('value',
        (snapshot) => {
          console.log('✅ Realtime Database conectado');
          const data: Report[] = [];
          setFirebaseError(null);
          const reportsObj = snapshot.val() as Record<string, any> | null;
          if (reportsObj) {
            Object.entries(reportsObj).forEach(([key, report]) => {
              if (
                report.latitude !== undefined &&
                report.longitude !== undefined &&
                typeof report.latitude === 'number' &&
                typeof report.longitude === 'number'
              ) {
                data.push({
                  id: key || report.id,
                  type: report.type || 'Barrera',
                  latitude: report.latitude,
                  longitude: report.longitude,
                  severity: report.severity || 'medium',
                });
              }
            });
          }
          console.log(`✅ Cargados ${data.length} reportes`);
          setReports(data);
        },
        (error: Error) => {
          console.error('❌ Firebase Error:', error);
          setFirebaseError('Error al cargar reportes. Verifica tu conexión.');
          setReports([]);
        }
      );
      return () => reportsRef.off('value', unsubscribe);
    } catch (error) {
      console.error('❌ General Firebase Error:', error);
      setFirebaseError('Error al conectar con la base de datos');
    }
  }, [getUserLocation]);

  // =========================
  // FILTRAR PUNTOS DE INTERÉS
  // =========================
  const filteredPOI = selectedPOICategory === 'all'
    ? POINTS_OF_INTEREST
    : POINTS_OF_INTEREST.filter(poi => poi.category === selectedPOICategory);

  // =========================
  // DRAWER ANIMATION
  // =========================
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  // =========================
  // LOADING
  // =========================
  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  // =========================
  // UI - MAPA
  // =========================
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={locationEnabled}
        showsMyLocationButton={locationEnabled}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
      >
        {/* Marcador de ubicación del usuario */}
        {locationEnabled && location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Tu ubicación"
            pinColor="#3b82f6"
          />
        )}

        {/* Reportes de obstáculos */}
        {showReports &&
          reports.map(report => {
            if (!report.latitude || !report.longitude) return null;
            const color =
              report.severity === 'high' ? '#ef4444' :
              report.severity === 'medium' ? '#f59e0b' : '#fbbf24';
            return (
              <Marker
                key={report.id}
                coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                title={report.type}
                description={`Severidad: ${report.severity}`}
                pinColor={color}
              />
            );
          })}

        {/* Puntos de interés */}
        {showPOIs &&
          filteredPOI.map(poi => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              title={poi.name}
              description={poi.address || poi.category}
              pinColor={getColorForCategory(poi.category)}
            />
          ))}
      </MapView>

      {/* Error de Firebase */}
      {firebaseError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{firebaseError}</Text>
        </View>
      )}

      {/* Botón Hamburguesa */}
      <TouchableOpacity style={styles.hamburgerButton} onPress={openDrawer}>
        <Ionicons name="menu" size={28} color="#1a1a1a" />
      </TouchableOpacity>

      {/* Drawer Modal */}
      <Modal
        visible={drawerVisible}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          <Animated.View
            style={[
              styles.drawerContent,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Leyenda y capas</Text>
              <TouchableOpacity onPress={closeDrawer}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Simbología */}
              <Text style={styles.sectionTitle}>📌 Simbología</Text>
              <View style={styles.legendSection}>
                <Text style={styles.subsectionTitle}>Obstáculos</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.colorBox, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Alta severidad</Text>
                  <View style={[styles.colorBox, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>Media severidad</Text>
                  <View style={[styles.colorBox, { backgroundColor: '#fbbf24' }]} />
                  <Text style={styles.legendText}>Baja severidad</Text>
                </View>

                <Text style={styles.subsectionTitle}>Puntos de interés</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.colorBox, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>🏥 Hospital</Text>
                  <View style={[styles.colorBox, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.legendText}>🏦 Banco</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.colorBox, { backgroundColor: '#8b5cf6' }]} />
                  <Text style={styles.legendText}>🌳 Parque</Text>
                  <View style={[styles.colorBox, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>🏛️ Gobierno</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.colorBox, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>💊 Farmacia</Text>
                  <View style={[styles.colorBox, { backgroundColor: '#ec4899' }]} />
                  <Text style={styles.legendText}>🍽️ Restaurante</Text>
                </View>
              </View>

              {/* Controles de capas */}
              <Text style={styles.sectionTitle}>🎛️ Capas</Text>
              <View style={styles.layerItem}>
                <Text style={styles.layerLabel}>Mostrar obstáculos</Text>
                <Switch
                  value={showReports}
                  onValueChange={setShowReports}
                  trackColor={{ false: '#ccc', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.layerItem}>
                <Text style={styles.layerLabel}>Mostrar puntos de interés</Text>
                <Switch
                  value={showPOIs}
                  onValueChange={setShowPOIs}
                  trackColor={{ false: '#ccc', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Selector de categoría de POI */}
              {showPOIs && (
                <>
                  <Text style={styles.sectionTitle}>🏷️ Filtrar por categoría</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {(['all', 'hospital', 'bank', 'park', 'government', 'pharmacy', 'restaurant'] as const).map(
                      category => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryButton,
                            selectedPOICategory === category && styles.categoryButtonActive,
                          ]}
                          onPress={() => setSelectedPOICategory(category)}
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              selectedPOICategory === category && styles.categoryButtonTextActive,
                            ]}
                          >
                            {category === 'all' ? '📍 Todos' : getCategoryLabel(category)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </ScrollView>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Info de ubicación (solo informativo) */}
      <View style={styles.infoPanel}>
        <View style={styles.infoBadge}>
          <Ionicons
            name={locationEnabled ? 'location' : 'location-outline'}
            size={16}
            color={locationEnabled ? '#10b981' : '#f59e0b'}
          />
          <Text style={styles.infoText}>
            {locationEnabled ? 'Ubicación habilitada' : 'Usando ubicación por defecto'}
          </Text>
        </View>
        <View style={styles.infoBadge}>
          <Ionicons name="warning" size={16} color="#ef4444" />
          <Text style={styles.infoText}>{reports.length} obstáculos reportados</Text>
        </View>
      </View>

      {/* Modal de ubicación */}
      <LocationPermissionModal
        visible={showLocationModal}
        onActivate={handleActivateLocation}
        onCancel={handleCancelLocation}
        title="Para continuar, activa la ubicación precisa"
        message="Necesitamos tu ubicación para mostrarte en el mapa de Tijuana."
      />
    </View>
  );
}

// =========================
// ESTILOS
// =========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    zIndex: 20,
  },
  errorText: { color: '#fff', fontSize: 12, flex: 1 },
  hamburgerButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 15,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  drawerContent: {
    width: width * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginTop: 8,
    marginBottom: 6,
  },
  legendSection: {
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    marginRight: 16,
  },
  layerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  layerLabel: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
});