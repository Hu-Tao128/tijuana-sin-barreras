import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { launchCamera } from 'react-native-image-picker';
import Button from '../../components/Button';
import { createReport } from '../../services/callable-functions';
import { REPORT_CATEGORIES, SEVERITY_LEVELS, BarrierType } from '../../services/types';
import { DEFAULT_LOCATION } from '../../services/constants';

interface GeoCoords {
  latitude: number;
  longitude: number;
}

export default function ReportScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState<BarrierType | null>(null);
  const [severity, setSeverity] = useState(5);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoCoords | null>(null);
  const [address, setAddress] = useState('Obteniendo ubicación...');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        setAddress(
          `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        );
      },
      () => {
        const fallback = {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
        };
        setLocation(fallback);
        setAddress('Tijuana Centro (ubicación estimada)');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  }, []);

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        saveToPhotos: false,
      });

      if (result.didCancel) return;

      const asset = result.assets?.[0];
      if (asset?.uri) {
        setPhotoUri(asset.uri);
      }
    } catch (error: any) {
      if (error?.message?.includes('permissions')) {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a la cámara para tomar fotos de los obstáculos.',
        );
      } else {
        Alert.alert('Error', 'No se pudo abrir la cámara.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Atención', 'Por favor selecciona una categoría.');
      return;
    }

    if (!location) {
      Alert.alert(
        'Atención',
        'No se pudo obtener tu ubicación. Intenta de nuevo.',
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await createReport({
        type: selectedCategory,
        latitude: location.latitude,
        longitude: location.longitude,
        severity,
        description: description.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          '¡Reporte enviado!',
          'Tu reporte ha sido registrado. La comunidad podrá confirmarlo.',
          [
            {
              text: 'Ver reporte',
              onPress: () => {
                navigation.navigate('ReportDetail', {
                  reportId: result.report.id,
                });
              },
            },
            {
              text: 'OK',
              onPress: () => {
                setSelectedCategory(null);
                setDescription('');
                setPhotoUri(null);
                setSeverity(5);
              },
            },
          ],
        );
      }
    } catch (error: any) {
      const msg =
        error?.message ?? error?.code ?? 'Error desconocido al enviar reporte.';
      Alert.alert('Error al enviar', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedCategory !== null && location !== null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reportar una obstrucción</Text>
          <Text style={styles.subtitle}>
            Ayuda a la accesibilidad en Tijuana reportando obstáculos en la
            infraestructura urbana.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.photoContainer, photoUri && styles.photoContainerWithImage]}
          activeOpacity={0.8}
          onPress={handleTakePhoto}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <>
              <View style={styles.photoCircle}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
              <Text style={styles.photoText}>Toma una foto del obstáculo</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>SELECCIONA LA CATEGORÍA</Text>
        <View style={styles.grid}>
          {REPORT_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.gridCard,
                  isSelected && styles.gridCardSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.gridLabel,
                    isSelected && styles.gridLabelSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>NIVEL DE SEVERIDAD</Text>
        <View style={styles.severityRow}>
          {SEVERITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.severityChip,
                severity === level.value && {
                  backgroundColor: level.color,
                  borderColor: level.color,
                },
              ]}
              onPress={() => setSeverity(level.value)}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === level.value && styles.severityTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionLabelInline}>UBICACIÓN DETECTADA</Text>
            <Text style={styles.gpsActive}>
              {location ? '🎯 GPS ACTIVO' : '⏳ Buscando...'}
            </Text>
          </View>

          <View style={styles.locationBody}>
            <View style={styles.mapMiniature}>
              <Text style={styles.mapIcon}>🗺️</Text>
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.addressTitle}>{address}</Text>
              <Text style={styles.addressSub}>
                {location
                  ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : 'Esperando señal GPS...'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>COMENTARIOS ADICIONALES</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe la barrera de accesibilidad con el mayor detalle posible..."
          placeholderTextColor="#767676"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        <View style={styles.buttonSpacing}>
          <Button
            title={
              submitting
                ? 'Enviando reporte...'
                : 'Realizar reporte'
            }
            onPress={handleSubmit}
            variant="primary"
            isLoading={submitting}
            disabled={!isFormValid}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#611232',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#434343',
    lineHeight: 20,
  },
  photoContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#9B2247',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 160,
    overflow: 'hidden',
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  photoContainerWithImage: {
    borderStyle: 'solid',
    paddingVertical: 0,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  photoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#611232',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  photoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#611232',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161A1D',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionLabelInline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161A1D',
    letterSpacing: 0.8,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  severityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  severityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#434343',
  },
  severityTextActive: {
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    backgroundColor: '#FFF',
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  gridCardSelected: {
    borderColor: '#611232',
    backgroundColor: '#FFF',
    borderWidth: 2,
    shadowColor: '#611232',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#434343',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  gridLabelSelected: {
    color: '#611232',
    fontWeight: '700',
  },
  locationContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676',
    letterSpacing: 0.5,
  },
  locationBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapMiniature: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  mapIcon: {
    fontSize: 18,
  },
  locationTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161A1D',
  },
  addressSub: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#161A1D',
    minHeight: 110,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#767676',
    textAlign: 'right',
    marginBottom: 16,
  },
  buttonSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
});
