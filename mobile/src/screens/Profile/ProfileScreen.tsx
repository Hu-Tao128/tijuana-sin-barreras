import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  StatusBar
} from 'react-native';
import Button from '../../components/Button';

export default function ProfileScreen() {
  // Estados para controlar las preferencias de accesibilidad (Checkboxes)
  const [useWheelchair, setUseWheelchair] = useState(true);
  const [visualImpairment, setVisualImpairment] = useState(false);

  const handleSaveChanges = () => {
    Alert.alert('Éxito', 'Cambios de perfil guardados correctamente.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. SECCIÓN DE AVATAR E INFORMACIÓN PERSONAL */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={() => Alert.alert('Cambiar Foto', 'Abrir galería...')}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>Mariana Ortiz</Text>
          <Text style={styles.userMeta}>Colaboradora desde 2023 • Tijuana, BC</Text>
        </View>

        {/* 2. PREFERENCIAS DE ACCESIBILIDAD */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferencias de Accesibilidad</Text>
          
          {/* Opción 1: Silla de ruedas */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.7} 
            onPress={() => setUseWheelchair(!useWheelchair)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>♿</Text>
              <Text style={styles.rowText}>Uso silla de ruedas</Text>
            </View>
            <View style={[styles.checkbox, useWheelchair && styles.checkboxChecked]}>
              {useWheelchair && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          {/* Opción 2: Discapacidad Visual */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            activeOpacity={0.7} 
            onPress={() => setVisualImpairment(!visualImpairment)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>👁️‍🗨️</Text>
              <Text style={styles.rowText}>Tengo discapacidad visual</Text>
            </View>
            <View style={[styles.checkbox, visualImpairment && styles.checkboxChecked]}>
              {visualImpairment && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. LUGARES GUARDADOS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Lugares Guardados</Text>
          
          <View style={styles.placeRow}>
            <Text style={styles.placeIcon}>🏠</Text>
            <View style={styles.placeTextContainer}>
              <Text style={styles.placeName}>Casa</Text>
              <Text style={styles.placeSub}>Zona Centro</Text>
            </View>
          </View>

          <View style={styles.placeRow}>
            <Text style={styles.placeIcon}>💼</Text>
            <View style={styles.placeTextContainer}>
              <Text style={styles.placeName}>Trabajo</Text>
              <Text style={styles.placeSub}>Vía Corporativo</Text>
            </View>
          </View>

          <View style={styles.placeRow}>
            <Text style={styles.placeIcon}>🏥</Text>
            <View style={styles.placeTextContainer}>
              <Text style={styles.placeName}>IMSS</Text>
              <Text style={styles.placeSub}>Clínica 7</Text>
            </View>
          </View>
        </View>

        {/* 4. SECCIÓN DE EMERGENCIA */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
          <Text style={styles.sectionSubtitle}>Acceso rápido durante la navegación en rutas.</Text>
          
          {/* Reutilización de la variante secundaria de tu componente global */}
          <Button 
            title="+ Agregar Contacto"
            onPress={() => Alert.alert('Contacto', 'Formulario para nuevo contacto...')}
            variant="secondary"
          />
        </View>

        {/* 5. MIS REPORTES */}
        <View style={styles.sectionCard}>
          <View style={styles.reportsHeader}>
            <Text style={styles.sectionTitle}>Mis Reportes</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>12 Reportes</Text>
            </View>
          </View>

          {/* Reporte 1 */}
          <View style={[styles.reportItem, { borderLeftColor: '#9B2247' }]}>
            <View style={styles.reportMain}>
              <Text style={styles.reportTitle}>Rampa Destruida</Text>
              <Text style={styles.reportAddress}>Calle 4ta y Av. Revolución</Text>
            </View>
            <View style={[styles.statusBadge, styles.badgeReview]}>
              <Text style={styles.statusTextReview}>EN REVISIÓN</Text>
            </View>
          </View>

          {/* Reporte 2 */}
          <View style={[styles.reportItem, { borderLeftColor: '#611232' }]}>
            <View style={styles.reportMain}>
              <Text style={styles.reportTitle}>Parada de Autobús Accesible</Text>
              <Text style={styles.reportAddress}>Paseo de los Héroes</Text>
            </View>
            <View style={[styles.statusBadge, styles.badgeVerified]}>
              <Text style={styles.statusTextVerified}>VERIFICADO</Text>
            </View>
          </View>
        </View>

        {/* 6. BOTONES DE ACCIÓN INFERIORES */}
        <View style={styles.actionContainer}>
          <Button 
            title="Guardar Cambios" 
            onPress={handleSaveChanges} 
            variant="primary"
          />
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            activeOpacity={0.6}
            onPress={() => Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?')}
          >
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
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
  // Perfil Superior
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#611232', // --Presidencia-principal-600
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#611232', // --Presidencia-principal-600
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  editIcon: {
    fontSize: 14,
    color: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#161A1D', // --Neutro-Neutro-800
    letterSpacing: -0.5,
  },
  userMeta: {
    fontSize: 13,
    color: '#767676', // --Neutro-Neutro-600
    marginTop: 4,
  },
  // Contenedores de Bloques (Tarjetas Blancas)
  sectionCard: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD', // --Neutro-Neutro-400
    elevation: 2,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#611232', // --Presidencia-principal-600
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#767676', // --Neutro-Neutro-600
    marginBottom: 16,
  },
  // Filas con Checkbox
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD', // --Neutro-Neutro-400
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434343', // --Neutro-Neutro-700
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#611232', // --Presidencia-principal-600
    borderColor: '#611232',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Filas de Lugares Guardados
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  placeIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  placeTextContainer: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#161A1D', // --Neutro-Neutro-800
  },
  placeSub: {
    fontSize: 12,
    color: '#767676', // --Neutro-Neutro-600
    marginTop: 2,
  },
  // Elementos de la lista de Reportes
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#434343',
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 14,
    marginVertical: 6,
  },
  reportMain: {
    flex: 1,
    marginRight: 10,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161A1D',
  },
  reportAddress: {
    fontSize: 12,
    color: '#767676',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeReview: {
    backgroundColor: '#FDECEF',
  },
  badgeVerified: {
    backgroundColor: '#611232',
  },
  statusTextReview: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9B2247', // --Primarios-Guinda-500
  },
  statusTextVerified: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  // Botones de acción finales
  actionContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 14,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#9B2247', // Un guinda vivo para la alerta de salida en lugar de un rojo chillón
    fontSize: 15,
    fontWeight: '700',
  },
});