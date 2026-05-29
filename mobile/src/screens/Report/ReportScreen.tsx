import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  StatusBar
} from 'react-native';
import Button from '../../components/Button'; // Tu componente de botón unificado

const CATEGORIES = [
  { id: 'sidewalk', label: 'Banqueta rota', icon: '🛠️' },
  { id: 'ramp', label: 'Rampa faltante', icon: '♿' },
  { id: 'path', label: 'Camino destruido', icon: '🚫' },
  { id: 'elevator', label: 'Elevador roto', icon: '🛗' },
];

export default function ReportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (!selectedCategory) {
      Alert.alert('Atención', 'Por favor, selecciona una categoría antes de enviar.');
      return;
    }
    Alert.alert('Reporte enviado', `Categoría: ${selectedCategory}\nComentarios: ${comments}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.title}>Reportar una obstrucción</Text>
          <Text style={styles.subtitle}>
            Ayuda a la accesibilidad en Tijuana reportando obstáculos en la infraestructura urbana.
          </Text>
        </View>

        {/* 1. CONTENEDOR DE FOTO */}
        <TouchableOpacity style={styles.photoContainer} activeOpacity={0.8} onPress={() => Alert.alert('Abrir Cámara...')}>
          <View style={styles.photoCircle}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
          <Text style={styles.photoText}>Toma una foto del obstáculo</Text>
        </TouchableOpacity>

        {/* 2. SELECCIÓN DE CATEGORÍA */}
        <Text style={styles.sectionLabel}>SELECCIONA LA CATEGORÍA</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.gridCard,
                  isSelected && styles.gridCardSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.gridIcon}>{category.icon}</Text>
                <Text style={[styles.gridLabel, isSelected && styles.gridLabelSelected]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. UBICACIÓN DETECTADA */}
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionLabelInline}>LOCALIZACIÓN DETECTADA</Text>
            <Text style={styles.gpsActive}>🎯 GPS ACTIVO</Text>
          </View>
          
          <View style={styles.locationBody}>
            <View style={styles.mapMiniature}>
              <Text style={{ fontSize: 18 }}>🗺️</Text>
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.addressTitle}>Av. Paseo de los Héroes, 10231</Text>
              <Text style={styles.addressSub}>Zona Urbana Rio Tijuana, 22010</Text>
            </View>
          </View>
        </View>

        {/* 4. COMENTARIOS ADICIONALES */}
        <Text style={styles.sectionLabel}>COMENTARIOS ADICIONALES</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe la barrera de accesibilidad con el mayor detalle posible..."
          placeholderTextColor="#767676" // --Neutro-Neutro-600
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={comments}
          onChangeText={setComments}
        />

        {/* 5. BOTÓN DE ENVÍO */}
        <View style={styles.buttonSpacing}>
          <Button 
            title="Realizar reporte" 
            onPress={handleSubmit}
            variant="primary"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3', // --Neutro-Neutro-300
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
    color: '#611232', // --Presidencia-principal-600
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#434343', // --Neutro-Neutro-700
    lineHeight: 20,
  },
  // Caja de foto mejorada e integrada a la marca
  photoContainer: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderWidth: 1.5,
    borderColor: '#9B2247', // --Primarios-Guinda-500
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // Sutil sombra para dar volumen
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  photoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#611232', // --Presidencia-principal-600
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
    color: '#611232', // --Text-Text-primary-enabled
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161A1D', // --Neutro-Neutro-800
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionLabelInline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161A1D', // --Neutro-Neutro-800
    letterSpacing: 0.8,
  },
  // Grid de Categorías
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#DDD', // --Neutro-Neutro-400
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
    borderColor: '#611232', // --Presidencia-principal-600
    backgroundColor: '#FFF',
    borderWidth: 2,
    // Resaltado de sombra institucional al seleccionar
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
    color: '#434343', // --Neutro-Neutro-700
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  gridLabelSelected: {
    color: '#611232', // --Text-Text-primary-enabled
    fontWeight: '700',
  },
  // Caja de Ubicación Limpia
  locationContainer: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderWidth: 1,
    borderColor: '#DDD', // --Neutro-Neutro-400
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
    color: '#767676', // --Neutro-Neutro-600
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
    backgroundColor: '#F3F3F3', // --Neutro-Neutro-300
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  locationTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161A1D', // --Neutro-Neutro-800
  },
  addressSub: {
    fontSize: 12,
    color: '#767676', // --Neutro-Neutro-600
    marginTop: 2,
  },
  // Área de comentarios (Estilo unificado con tu componente Input)
  textArea: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderWidth: 1.5,
    borderColor: '#DDD', // --Neutro-Neutro-400
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#161A1D', // --Neutro-Neutro-800
    minHeight: 110,
    marginBottom: 24,
  },
  buttonSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
});