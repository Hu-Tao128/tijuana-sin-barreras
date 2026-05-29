import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  StatusBar
} from 'react-native';
import Button from '../../components/Button';

export default function RouteScreen() {
  // Estados para simular la interacción con filtros en español
  const [wheelchairFriendly, setWheelchairFriendly] = useState(true);
  const [lowSteps, setLowSteps] = useState(false);
  const [minimalIncline, setMinimalIncline] = useState(false);
  
  // Estado para saber cuál ruta alternativa está seleccionada
  const [selectedRoute, setSelectedRoute] = useState('paseo_heroes');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.title}>Planifica tu Ruta</Text>
          <Text style={styles.subtitle}>Navegación accesible para las calles de Tijuana.</Text>
        </View>

        {/* 1. PLANIFICADOR DE ORIGEN Y DESTINO */}
        <View style={styles.searchCard}>
          {/* Campo Origen */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabelField}>Origen</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🎯</Text>
              <TextInput 
                style={styles.textInputStyle} 
                value="Zona Centro, Tijuana" 
                editable={false} 
              />
            </View>
          </View>

          {/* Botón de Intercambio de ruta */}
          <View style={styles.swapButtonContainer}>
            <TouchableOpacity style={styles.swapButton} activeOpacity={0.8} onPress={() => Alert.alert('Intercambiar rutas')}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* Campo Destino */}
          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Text style={[styles.inputLabelField, styles.inputLabelDestino]}>Destino</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput 
                style={styles.textInputStyle} 
                value="Plaza Río Tijuana" 
                editable={false} 
              />
            </View>
          </View>
        </View>

        {/* 2. FILTROS RÁPIDOS DE ACCESIBILIDAD */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {/* Filtro Silla de ruedas */}
            <TouchableOpacity 
              style={[styles.filterBadge, wheelchairFriendly ? styles.filterBadgeActive : styles.filterBadgeInactive]} 
              onPress={() => setWheelchairFriendly(!wheelchairFriendly)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, wheelchairFriendly ? styles.textActive : styles.textInactive]}>
                ♿ Apto para silla de ruedas
              </Text>
            </TouchableOpacity>

            {/* Filtro Escalones Bajos */}
            <TouchableOpacity 
              style={[styles.filterBadge, lowSteps ? styles.filterBadgeActive : styles.filterBadgeInactive]} 
              onPress={() => setLowSteps(!lowSteps)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, lowSteps ? styles.textActive : styles.textInactive]}>
                🪜 Escalones bajos
              </Text>
            </TouchableOpacity>

            {/* Filtro Inclinación Mínima */}
            <TouchableOpacity 
              style={[styles.filterBadge, minimalIncline ? styles.filterBadgeActive : styles.filterBadgeInactive]} 
              onPress={() => setMinimalIncline(!minimalIncline)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, minimalIncline ? styles.textActive : styles.textInactive]}>
                📉 Inclinación mínima
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 3. MINI MAPA PREVIO CON INFORMACIÓN */}
        <View style={styles.mapPreviewCard}>
          {/* Alerta de "Evitar Calle" */}
          <View style={styles.avoidBadge}>
            <Text style={styles.avoidText}>⚠️ Evitar: Calle 4ta</Text>
          </View>

          {/* Placeholder del centro del mapa */}
          <View style={styles.mapIconPlaceholder}>
            <Text style={{ fontSize: 36 }}>🗺️</Text>
          </View>

          {/* Indicador de Nivel de Seguridad */}
          <View style={styles.safetyCard}>
            <Text style={styles.safetyLabel}>NIVEL DE ACCESIBILIDAD</Text>
            <Text style={styles.safetyPercentage}>Alto (98%)</Text>
          </View>

          {/* Botón Flotante para expandir mapa */}
          <TouchableOpacity style={styles.expandButton} activeOpacity={0.8} onPress={() => Alert.alert('Maximizar mapa')}>
            <Text style={styles.expandIcon}>⛶</Text>
          </TouchableOpacity>
        </View>

        {/* 4. SECCIÓN DE RUTAS SUGERIDAS */}
        <View style={styles.suggestedHeaderRow}>
          <Text style={styles.sectionTitle}>Rutas sugeridas</Text>
          <Text style={styles.sortLabel}>Ordenar por: Más rápida</Text>
        </View>

        {/* Ruta Alternativa 1: Paseo de los Héroes */}
        <TouchableOpacity 
          style={[styles.routeCard, selectedRoute === 'paseo_heroes' ? styles.routeCardSelected : styles.routeCardUnselected]}
          onPress={() => setSelectedRoute('paseo_heroes')}
          activeOpacity={0.8}
        >
          <View style={styles.routeLeftContainer}>
            <View style={[styles.routeIconBox, selectedRoute === 'paseo_heroes' && styles.routeIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>👨‍🦽</Text>
            </View>
            <View style={styles.routeTextData}>
              <Text style={[styles.routeNameText, selectedRoute === 'paseo_heroes' && styles.routeTextActive]}>Por Paseo de los Héroes</Text>
              <Text style={styles.routeMetaText}>⏱️ 12 min  •  📏 1.2 km</Text>
            </View>
          </View>
          <View style={styles.routeRightContainer}>
            <View style={[styles.scoreBadge, selectedRoute === 'paseo_heroes' ? styles.scoreBadgeActive : styles.scoreBadgeInactive]}>
              <Text style={[styles.scoreText, selectedRoute === 'paseo_heroes' && styles.scoreTextActive]}>9.5/10</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Ruta Alternativa 2: Independencia */}
        <TouchableOpacity 
          style={[styles.routeCard, selectedRoute === 'ave_independencia' ? styles.routeCardSelected : styles.routeCardUnselected]}
          onPress={() => setSelectedRoute('ave_independencia')}
          activeOpacity={0.8}
        >
          <View style={styles.routeLeftContainer}>
            <View style={[styles.routeIconBox, selectedRoute === 'ave_independencia' && styles.routeIconBoxActive]}>
              <Text style={{ fontSize: 18 }}>🚶‍♂️</Text>
            </View>
            <View style={styles.routeTextData}>
              <Text style={[styles.routeNameText, selectedRoute === 'ave_independencia' && styles.routeTextActive]}>Por Av. Independencia</Text>
              <Text style={styles.routeMetaText}>⏱️ 15 min  •  📏 1.5 km</Text>
            </View>
          </View>
          <View style={styles.routeRightContainer}>
            <View style={[styles.scoreBadge, selectedRoute === 'ave_independencia' ? styles.scoreBadgeActive : styles.scoreBadgeInactive]}>
              <Text style={[styles.scoreText, selectedRoute === 'ave_independencia' && styles.scoreTextActive]}>7.2/10</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </TouchableOpacity>

        {/* 5. BOTÓN DE ACCIÓN FINAL */}
        <View style={styles.buttonContainer}>
          <Button 
            title="Iniciar navegación" 
            onPress={() => Alert.alert('Navegación', 'Iniciando guía GPS paso a paso...')} 
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#611232', // --Presidencia-principal-600
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#434343', // --Neutro-Neutro-700
  },
  // Planificador de Rutas (Buzón de Inputs integrado)
  searchCard: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD', // --Neutro-Neutro-400
    position: 'relative',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputLabelField: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676', // --Neutro-Neutro-600
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputLabelDestino: {
    color: '#9B2247', // Resaltado sutil guinda intermedio
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  textInputStyle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161A1D', // --Neutro-Neutro-800
    padding: 0,
    flex: 1,
  },
  // Botón de Swap con la paleta Guinda
  swapButtonContainer: {
    position: 'absolute',
    right: 28,
    top: '50%',
    marginTop: -16,
    zIndex: 10,
  },
  swapButton: {
    backgroundColor: '#611232', // --Presidencia-principal-600
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  swapIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Contenedor de Filtros Horizontales corregidos
  filterContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  filterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  filterBadgeActive: {
    backgroundColor: '#FFF',
    borderColor: '#611232', // Activo con Guinda Principal
  },
  filterBadgeInactive: {
    backgroundColor: '#FFF',
    borderColor: '#DDD', // --Neutro-Neutro-400
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textActive: { 
    color: '#611232',
    fontWeight: '700'
  },
  textInactive: { 
    color: '#767676' 
  },
  // Área del Mapa Limpia e Institucional
  mapPreviewCard: {
    backgroundColor: '#EAEAEA',
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapIconPlaceholder: {
    opacity: 0.5,
  },
  avoidBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#9B2247', // Advertencia refinada al guinda medio
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  avoidText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  safetyCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    elevation: 2,
  },
  safetyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#767676',
    letterSpacing: 0.5,
  },
  safetyPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#611232', // Resaltado guinda institucional
    marginTop: 1,
  },
  expandButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#611232',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  expandIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Listado de Rutas Sugeridas
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161A1D',
  },
  sortLabel: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '600',
  },
  routeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1.5,
    backgroundColor: '#FFF',
  },
  routeCardSelected: {
    borderColor: '#611232', // Guinda principal al seleccionar
    elevation: 3,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  routeCardUnselected: {
    borderColor: '#DDD',
  },
  routeLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  routeIconBoxActive: {
    borderColor: '#611232',
    backgroundColor: '#FDECEF', // Fondo sutil guinda traslúcido
  },
  routeTextData: {
    flex: 1,
  },
  routeNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#434343',
  },
  routeTextActive: {
    color: '#611232',
  },
  routeMetaText: {
    fontSize: 12,
    color: '#767676',
    marginTop: 4,
  },
  routeRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
  },
  scoreBadgeActive: {
    backgroundColor: '#611232',
    borderColor: '#611232',
  },
  scoreBadgeInactive: {
    backgroundColor: '#F3F3F3',
    borderColor: '#DDD',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#767676',
  },
  scoreTextActive: {
    color: '#FFF',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#DDD',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
});