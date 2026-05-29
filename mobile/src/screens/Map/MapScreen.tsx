import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';

// Filtros de accesibilidad para la barra superior
const FILTER_CATEGORIES = [
  { id: 'all', label: '🌐 Ver Todo', color: '#007AFF' },
  { id: 'motriz', label: '♿ Rampas / Banquetas', color: '#FF9500' },
  { id: 'visual', label: '👁️ Podotáctil / Audio', color: '#5856D6' },
  { id: 'obstaculo', label: '🚧 Obstrucciones', color: '#FF3B30' },
];

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. MAPA SIMULADO (Contenedor de Fondo) */}
      <View style={styles.mapCanvas}>
        <Text style={styles.mapPlaceholderText}>🗺️ Google Maps SDK (Modo Estático)</Text>
        <Text style={styles.mapCoordinates}>Tijuana, B.C. • Centro Geográfico</Text>

        {/* Marcador Simulado 1 (Confirmado) */}
        <View style={[styles.mockPin, { top: '35%', left: '40%', backgroundColor: '#FF3B30' }]}>
          <Text style={styles.pinIcon}>🚨</Text>
        </View>

        {/* Marcador Simulado 2 (Pendiente) */}
        <View style={[styles.mockPin, { top: '55%', left: '65%', backgroundColor: '#FF9500' }]}>
          <Text style={styles.pinIcon}>⏳</Text>
        </View>

        {/* Marcador Simulado 3 (Resuelto) */}
        <View style={[styles.mockPin, { top: '25%', left: '20%', backgroundColor: '#34C759' }]}>
          <Text style={styles.pinIcon}>✅</Text>
        </View>
      </View>

      {/* 2. BARRA SUPERIOR DE FILTROS (Flotante sobre el mapa) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_CATEGORIES.map((category) => {
            const isActive = activeFilter === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterBadge,
                  isActive ? { backgroundColor: category.color, borderColor: category.color } : styles.filterBadgeInactive
                ]}
                onPress={() => setActiveFilter(category.id)}
              >
                <Text style={[styles.filterLabel, isActive ? styles.textActive : styles.textInactive]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. TARJETA INFORMATIVA FLOTANTE (Simula la selección de un Pin) */}
      <View style={styles.floatingCard}>
        <View style={styles.indicatorBar} />
        <View style={styles.cardHeader}>
          <Text style={styles.cardTag}>🚨 REPORTE SELECCIONADO</Text>
          <Text style={styles.cardStatusText}>Confirmado</Text>
        </View>
        <Text style={styles.cardTitle}>Rampa obstruida por comercio</Text>
        <Text style={styles.cardAddress}>📍 Av. Revolución, Zona Centro (Frente al Nelson)</Text>
        <Text style={styles.cardDescription}>
          Un puesto ambulante bloquea por completo la rampa de acceso para sillas de ruedas en la esquina.
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5EA',
  },
  // Estilos del Mapa Falso
  mapCanvas: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5F1E2', // Tono verde claro simulando áreas verdes de mapas
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginBottom: 4,
  },
  mapCoordinates: {
    fontSize: 12,
    color: '#AEAEB2',
  },
  // Pines Falsos
  mockPin: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pinIcon: {
    fontSize: 16,
  },
  // Contenedor de Filtros superiores
  filterContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    height: 50,
  },
  filterScroll: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  filterBadgeInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#E5E5EA',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textActive: { color: '#ffffff' },
  textInactive: { color: '#3A3A3C' },
  // Tarjeta Flotante Inferior
  floatingCard: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  indicatorBar: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  cardStatusText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#636366',
    lineHeight: 20,
  },
});