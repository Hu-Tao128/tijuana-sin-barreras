/**
 * screens/MapScreen.tsx
 * Mapa principal con:
 * - Reportes de obstáculos
 * - Puntos de interés (hospitales, bancos, etc.)
 * - Ubicación del usuario
 * 
 * ✅ SOLUCIÓN: Incluye manejo correcto de errores de Firestore
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

import { db } from '../../services/firebase';
import { DEFAULT_LOCATION } from '../../services/constants';
import { POINTS_OF_INTEREST, getColorForCategory } from '../../services/points-of-interest';
import LocationPermissionModal from '../../components/LocationPermissionModal';

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

  // =========================
  // PERMISOS
  // =========================

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }

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
        // Si el GPS está desactivado o hay error, usar ubicación por defecto
        if (error.code === 2 || error.message?.includes('disabled')) {
          console.log('GPS desactivado');
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

  // Manejar respuesta del modal de ubicación
  const handleActivateLocation = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
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
      const reportsRef = collection(db, 'reports');
      
      // ✅ SOLUCIÓN: Agregar manejo de errores y timeout
      const unsubscribe = onSnapshot(
        reportsRef,
        (snapshot) => {
          console.log('✅ Firestore conectado exitosamente');
          const data: Report[] = [];
          setFirebaseError(null); // Limpiar errores anteriores

          snapshot.forEach(doc => {
            const report = doc.data();

            // Validar que tenga coordenadas válidas
            if (
              report.latitude !== undefined &&
              report.longitude !== undefined &&
              typeof report.latitude === 'number' &&
              typeof report.longitude === 'number'
            ) {
              data.push({
                id: doc.id,
                type: report.type || 'Barrera',
                latitude: report.latitude,
                longitude: report.longitude,
                severity: report.severity || 'medium',
              });
            }
          });

          console.log(`✅ Cargados ${data.length} reportes`);
          setReports(data);
        },
        (error) => {
          console.error('❌ Firebase Error:', error.code, error.message);
          
          // Mostrar mensaje legible del error
          if (error.code === 'permission-denied') {
            setFirebaseError('⚠️ Permisos insuficientes. Contacta al administrador.');
          } else if (error.code === 'unauthenticated') {
            setFirebaseError('⚠️ Necesitas iniciar sesión.');
          } else {
            setFirebaseError(`Error: ${error.message}`);
          }
          
          // Continuar mostrando el mapa aunque haya error
          setReports([]);
        },
      );

      return () => unsubscribe();
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
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Tu ubicación"
            pinColor="#3b82f6"
          />
        )}

        {/* Marcadores de reportes de obstáculos */}
        {reports.map(report => {
          if (!report.latitude || !report.longitude) return null;

          const color = 
            report.severity === 'high' ? '#ef4444' : 
            report.severity === 'medium' ? '#f59e0b' : 
            '#fbbf24';

          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              title={report.type}
              description={`Severidad: ${report.severity}`}
              pinColor={color}
            />
          );
        })}

        {/* Marcadores de puntos de interés */}
        {filteredPOI.map(poi => (
          <Marker
            key={poi.id}
            coordinate={{
              latitude: poi.latitude,
              longitude: poi.longitude,
            }}
            title={poi.name}
            description={poi.address || poi.category}
            pinColor={getColorForCategory(poi.category)}
          />
        ))}
      </MapView>

      {/* ERROR DE FIREBASE - Mostrar si hay problema de conexión */}
      {firebaseError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{firebaseError}</Text>
        </View>
      )}

      {/* PANEL DE FILTROS - Puntos de Interés */}
      <View style={styles.filterPanel}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {(['all', 'hospital', 'bank', 'park', 'government', 'pharmacy', 'restaurant'] as const).map(
            category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  selectedPOICategory === category && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedPOICategory(category)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedPOICategory === category && styles.filterButtonTextActive,
                  ]}
                >
                  {category === 'all' ? '📍 Todos' : 
                   category === 'hospital' ? '🏥 Hospitales' :
                   category === 'bank' ? '🏦 Bancos' :
                   category === 'park' ? '🌳 Parques' :
                   category === 'government' ? '🏛️ Gobierno' :
                   category === 'pharmacy' ? '💊 Farmacias' :
                   '🍽️ Restaurantes'}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/* INFO DE UBICACIÓN */}
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

      {/* MODAL DE UBICACIÓN */}
      <LocationPermissionModal
        visible={showLocationModal}
        onActivate={handleActivateLocation}
        onCancel={handleCancelLocation}
        title="Para continuar, activa la ubicación precisas"
        message="Necesitamos tu ubicación para mostrarte en el mapa de Tijuana."
      />
    </View>
  );
}

// =========================
// ESTILOS
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  map: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

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

  errorText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },

  filterPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },

  filterScroll: {
    paddingHorizontal: 12,
  },

  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },

  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  filterButtonTextActive: {
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
