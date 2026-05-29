import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, Alert } from 'react-native';
import auth from '@react-native-firebase/auth'; // 👈 Importamos el módulo de autenticación
import Button from '../../components/Button';
import CardReport from '../../components/CardReport';

const RECENT_REPORTS = [
  {
    id: '1',
    title: 'Rampa obstruida por comercio',
    description: 'Un puesto ambulante bloquea por completo la rampa de acceso para sillas de ruedas en la esquina.',
    status: 'confirmed' as const,
    location: 'Av. Revolución, Zona Centro',
  },
  {
    id: '2',
    title: 'Banqueta destruida / Grietas',
    description: 'La banqueta está levantada por las raíces de un árbol, impidiendo el paso seguro de peatones y carriolas.',
    status: 'pending' as const,
    location: 'Blvd. Agua Caliente, Frente a Las Torres',
  },
  {
    id: '3',
    title: 'Semáforo peatonal sin audio',
    description: 'El sistema acústico para personas con discapacidad visual dejó de funcionar desde la semana pasada.',
    status: 'resolved' as const,
    location: 'Paseo de los Héroes, Zona Río',
  },
];

export default function HomeScreen({ navigation }: any) {
  // Estado para almacenar el nombre que mostraremos en la bienvenida
  const [userName, setUserName] = useState('Ciudadano');

  useEffect(() => {
    // 1. Obtenemos el usuario que actualmente tiene la sesión activa en el dispositivo
    const currentUser = auth().currentUser;

    if (currentUser) {
      // 2. Si el usuario se registró guardando su "displayName", lo usamos.
      // Si no tiene "displayName" pero sí correo, limpiamos el correo para extraer la primera parte antes del '@'.
      if (currentUser.displayName) {
        setUserName(currentUser.displayName);
      } else if (currentUser.email) {
        const emailName = currentUser.email.split('@')[0];
        // Capitalizamos la primera letra para que se vea estético (ej: "juan.perez" -> "Juan.perez")
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    }
  }, []); // Se ejecuta únicamente cuando la pantalla se monta

  const handleGoToReport = () => {
    navigation.navigate('Report');
  };

  // Modificamos el renderHeader para usar la variable de estado 'userName'
  const renderHeader = () => (
    <View>
      {/* 1. Encabezado Personalizado */}
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Hola, {userName} 👋</Text>
        <Text style={styles.appTitle}>Tijuana Sin Barreras</Text>
      </View>

      {/* 2. Tarjeta de Impacto Comunitario */}
      <View style={styles.impactCard}>
        <Text style={styles.impactTitle}>Impacto en tu ciudad 📍</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>142</Text>
            <Text style={styles.statLabel}>Reportes Activos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>58</Text>
            <Text style={styles.statLabel}>Solucionados</Text>
          </View>
        </View>
      </View>

      {/* 3. Botón de Acción Rápida */}
      <View style={styles.actionContainer}>
        <Text style={styles.sectionTitle}>¿Detectaste un obstáculo?</Text>
        <Button 
          title="📸 Reportar Nueva Barrera" 
          onPress={handleGoToReport} 
          variant="primary"
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Reportes recientes en la comunidad</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={RECENT_REPORTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardReport
            title={item.title}
            description={item.description}
            status={item.status}
            location={item.location}
            onPress={() => Alert.alert(`Detalles de: ${item.title}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  impactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#dee2e6',
  },
  actionContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
});