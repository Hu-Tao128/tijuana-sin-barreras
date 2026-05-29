import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import Geolocation from 'react-native-geolocation-service';

import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../../services/firebase';

interface Report {
  id: string;
  type?: string;
  latitude?: number;
  longitude?: number;
}

export default function MapScreen() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.log('Permiso denegado');

      // ubicación por defecto (Tijuana)
      setLocation({
        latitude: 32.5149,
        longitude: -117.0382,
      });

      setLoading(false);
      return;
    }

   Geolocation .getCurrentPosition(
      position => {
        console.log('Ubicación obtenida');

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLoading(false);
      },

      error => {
        console.log('Location Error:', error);

        // fallback Tijuana
        setLocation({
          latitude: 32.5149,
          longitude: -117.0382,
        });

        setLoading(false);
      },

      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
        forceLocationManager: true,
      },
    );
  }, []);

  // =========================
  // FIREBASE
  // =========================

  useEffect(() => {
    getUserLocation();

    try {
      const reportsRef = collection(db, 'reports');

      const unsubscribe = onSnapshot(
        reportsRef,
        snapshot => {
          const data: Report[] = [];

          snapshot.forEach(doc => {
            const report = doc.data();

            // Validar coordenadas
            if (
              report.latitude &&
              report.longitude
            ) {
              data.push({
                id: doc.id,
                type: report.type || 'Barrera',
                latitude: report.latitude,
                longitude: report.longitude,
              });
            }
          });

          setReports(data);
        },

        error => {
          console.log('Firebase Error:', error);
        },
      );

      return () => unsubscribe();
    } catch (error) {
      console.log('General Firebase Error:', error);
    }
  }, [getUserLocation]);

  // =========================
  // LOADING
  // =========================

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {reports.map(report => {
          if (
            !report.latitude ||
            !report.longitude
          ) {
            return null;
          }

          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              title={report.type}
              description="Barrera reportada"
            />
          );
        })}
      </MapView>
    </View>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});