import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
  Alert,
  Linking,
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
  const [locationEnabled, setLocationEnabled] = useState(true);

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
          message:
            'Esta aplicación necesita acceso a tu ubicación para mostrarte en el mapa.',
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
  // ALERTA DE UBICACIÓN DESACTIVADA
  // =========================

  const showLocationDisabledAlert = useCallback(() => {
    Alert.alert(
      'GPS Desactivado',
      'Por favor, activa tu ubicación para poder usar el mapa correctamente.',
      [
        {
          text: 'Cancelar',
          onPress: () => {
            console.log('Usuario canceló activar ubicación');
            // Usa ubicación por defecto
            setLocation({
              latitude: 32.5149,
              longitude: -117.0382,
            });
            setLoading(false);
          },
          style: 'cancel',
        },
        {
          text: 'Abrir Configuración',
          onPress: () => {
            // Abre la configuración de ubicación del dispositivo
            if (Platform.OS === 'android') {
              Linking.openSettings();
            } else {
              Linking.openURL('App-Prefs:Privacy/LOCATION');
            }
          },
          style: 'default',
        },
      ],
      { cancelable: false },
    );
  }, []);

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

      setLocationEnabled(false);
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        console.log('Ubicación obtenida');

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationEnabled(true);
        setLoading(false);
      },

      error => {
        console.log('Location Error:', error);

        // Verificar si el error es porque el GPS está desactivado
        // En Android, código de error 2 = POSITION_UNAVAILABLE (GPS desactivado)
        // En iOS, pueden haber diferentes códigos de error
        if (error.code === 2 || error.message.includes('disabled')) {
          console.log('GPS desactivado');
          setLocationEnabled(false);
          showLocationDisabledAlert();
        } else {
          // Otro tipo de error, usar ubicación por defecto
          setLocation({
            latitude: 32.5149,
            longitude: -117.0382,
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
        showLocationDialog: true, // Android mostrará el popup nativo de "Activar GPS"
        forceRequestLocation: true,
      },
    );
  }, [showLocationDisabledAlert]);

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
        showsUserLocation={locationEnabled}
        showsMyLocationButton={locationEnabled}
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
