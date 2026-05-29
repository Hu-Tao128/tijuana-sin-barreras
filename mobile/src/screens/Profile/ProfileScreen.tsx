import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  StatusBar,
  TextInput
} from 'react-native';
import Button from '../../components/Button';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import functions from '@react-native-firebase/functions';

export default function ProfileScreen() {
  const [, setLoading] = useState(true);

  // 1. Datos de Cuenta Básicos
  const [name, setName] = useState('Usuario');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('citizen');

  // 2. Perfil de Accesibilidad de Ruteo (Campos Oficiales del Backend)
  const [mobilityProfile, setMobilityProfile] = useState<'ambulatory' | 'wheelchair'>('ambulatory');
  const [visionProfile, setVisionProfile] = useState<'normal' | 'low_vision' | 'blind'>('normal');
  const [maxWalkingMeters, setMaxWalkingMeters] = useState<number>(500);
  const [canClimbStairs, setCanClimbStairs] = useState<boolean>(true);
  const [maxStairSteps, setMaxStairSteps] = useState<number>(10);
  const [needsLowNoise, setNeedsLowNoise] = useState<boolean>(false);

  // 3. Contacto de Emergencia Estructurado
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // 4. Datos adicionales del Modelo
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setEmail(currentUser.email || '');
    setName(currentUser.displayName || 'Ciudadano');

    // Escuchamos en tiempo real el documento que la función 'registerUserProfile' gestiona
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            setRole(data.role || 'citizen');
            setMobilityProfile(data.mobilityProfile || 'ambulatory');
            setVisionProfile(data.visionProfile || 'normal');
            setMaxWalkingMeters(data.maxWalkingMeters ?? 500);
            setCanClimbStairs(data.canClimbStairs ?? true);
            setMaxStairSteps(data.maxStairSteps ?? 10);
            setNeedsLowNoise(data.needsLowNoise ?? false);
            setReportCount(data.reportCount || 0);
            
            if (data.emergencyContact) {
              setEmergencyName(data.emergencyContact.name || '');
              setEmergencyPhone(data.emergencyContact.phone || '');
            }
          }
        }
        setLoading(false);
      }, (error) => {
        console.error("Error al escuchar perfil: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (await GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
      await auth().signOut();       
    } catch {
      Alert.alert('Error al cerrar sesión');
    }
  };

  // Guardado respetando la estructura exacta demandada por el ruteo
  // 2. FUNCIÓN DE GUARDADO ACTUALIZADA AL MODELO OFICIAL
  const handleSaveChanges = async () => {
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      Alert.alert('Error', 'No hay ninguna sesión activa.');
      return;
    }

    setLoading(true); // Mostramos el indicador de carga mientras el servidor procesa

    try {
      // Conectamos con la función alojada en tu Firebase
      const registerUserProfile = functions().httpsCallable('registerUserProfile');

      // Enviamos el paquete de parámetros EXACTO que pide tu tabla de especificaciones
      const response = await registerUserProfile({
        uid: currentUser.uid,                             // Requerido
        displayName: name || currentUser.displayName,       // Requerido
        email: currentUser.email,                          // Requerido
        phoneNumber: emergencyPhone ? currentUser.phoneNumber : undefined, 
        edad: 25, // 💡 Nota: Puedes agregar un useState para capturar la edad real en la UI si lo deseas
        role: role, // Mantiene el rol actual (citizen por defecto)
        mobilityProfile: mobilityProfile,
        maxWalkingMeters: Number(maxWalkingMeters),
        canClimbStairs: canClimbStairs,
        maxStairSteps: canClimbStairs ? Number(maxStairSteps) : 0,
        visionProfile: visionProfile,
        transportModes: mobilityProfile === 'wheelchair' ? ['wheelchair', 'public_transport'] : ['walking', 'public_transport'],
        needsLowNoise: needsLowNoise,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone
        },
        preferredLanguage: "es"
      });

      // Validamos la respuesta que nos da tu Backend en el JSON
      if (response.data && (response.data as any).success) {
        Alert.alert('¡Excelente!', 'Tu perfil de accesibilidad ha sido creado y sincronizado en Tijuana sin Barreras.');
      } else {
        Alert.alert('Aviso', 'El perfil se procesó pero no recibimos confirmación de éxito.');
      }

    } catch (error: any) {
  console.error("Error al ejecutar registerUserProfile:", error);
  // Reemplaza temporalmente tu alerta por esta para ver el culpable real:
  Alert.alert(
    'Detalle del Error', 
    `Código: ${error.code}\nMensaje: ${error.message}`
  );
} finally {
      setLoading(false); // Apagamos el indicador de carga
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. SECCIÓN DE AVATAR E INFORMACIÓN DE ROL */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} 
              style={styles.avatar} 
            />
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userMeta}>{email}</Text>
          <Text style={styles.reportCounter}>📊 {reportCount} Reportes Generados</Text>
        </View>

        {/* 2. CONFIGURACIÓN DEL PERFIL DE MOVILIDAD */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Perfil de Movilidad</Text>
          <Text style={styles.sectionSubtitle}>Define cómo te desplazas para calcular la ruta óptima.</Text>

          {/* Opción Ambulatorio */}
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setMobilityProfile('ambulatory')}
          >
            <Text style={styles.rowText}>🚶 Ambulatorio (A pie)</Text>
            <View style={[styles.radio, mobilityProfile === 'ambulatory' && styles.radioChecked]} />
          </TouchableOpacity>

          {/* Opción Silla de Ruedas */}
          <TouchableOpacity 
            style={styles.radioRow} 
            onPress={() => setMobilityProfile('wheelchair')}
          >
            <Text style={styles.rowText}>♿ Uso Silla de Ruedas</Text>
            <View style={[styles.radio, mobilityProfile === 'wheelchair' && styles.radioChecked]} />
          </TouchableOpacity>
        </View>

        {/* 3. PARÁMETROS DE RUTEO FÍSICO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Límites y Capacidades de Ruta</Text>
          
          <Text style={styles.inputLabel}>Distancia máxima de caminata sin pausa (metros):</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={maxWalkingMeters.toString()}
            onChangeText={(val) => setMaxWalkingMeters(Number(val) || 0)}
          />

          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setCanClimbStairs(!canClimbStairs)}
          >
            <Text style={styles.rowText}>¿Puedes subir escaleras?</Text>
            <View style={[styles.checkbox, canClimbStairs && styles.checkboxChecked]}>
              {canClimbStairs && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          {canClimbStairs && (
            <>
              <Text style={styles.inputLabel}>Máximo de escalones permitidos por tramo:</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={maxStairSteps.toString()}
                onChangeText={(val) => setMaxStairSteps(Number(val) || 0)}
              />
            </>
          )}

          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setNeedsLowNoise(!needsLowNoise)}
          >
            <Text style={styles.rowText}>🔇 Evitar zonas ruidosas u obras</Text>
            <View style={[styles.checkbox, needsLowNoise && styles.checkboxChecked]}>
              {needsLowNoise && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. PERFIL VISUAL */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Perfil de Visión</Text>
          
          {/* Normal */}
          <TouchableOpacity style={styles.radioRow} onPress={() => setVisionProfile('normal')}>
            <Text style={styles.rowText}>👁️ Visión Estándar</Text>
            <View style={[styles.radio, visionProfile === 'normal' && styles.radioChecked]} />
          </TouchableOpacity>

          {/* Baja Visión */}
          <TouchableOpacity style={styles.radioRow} onPress={() => setVisionProfile('low_vision')}>
            <Text style={styles.rowText}>👓 Baja Visión</Text>
            <View style={[styles.radio, visionProfile === 'low_vision' && styles.radioChecked]} />
          </TouchableOpacity>

          {/* Ceguera */}
          <TouchableOpacity style={styles.radioRow} onPress={() => setVisionProfile('blind')}>
            <Text style={styles.rowText}>🦯 Ceguera total / Bastón Guiador</Text>
            <View style={[styles.radio, visionProfile === 'blind' && styles.radioChecked]} />
          </TouchableOpacity>
        </View>

        {/* 5. CONTACTO DE EMERGENCIA OFICIAL */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          <Text style={styles.sectionSubtitle}>Datos obligatorios para la red de apoyo en trayectos.</Text>
          
          <Text style={styles.inputLabel}>Nombre del Contacto:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: María Alcántara"
            value={emergencyName}
            onChangeText={setEmergencyName}
          />

          <Text style={styles.inputLabel}>Teléfono de Contacto:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: +526641234567"
            keyboardType="phone-pad"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
          />
        </View>

        {/* 6. ACCIONES DE GUARDADO */}
        <View style={styles.actionContainer}>
          <Button 
            title="Sincronizar Perfil de Ruteo" 
            onPress={handleSaveChanges} 
            variant="primary"
          />
          
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.6} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión de la App</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F3F3' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#767676', fontWeight: '500' },
  avatarSection: { alignItems: 'center', marginVertical: 16 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#611232' },
  roleBadge: { position: 'absolute', bottom: -6, backgroundColor: '#611232', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 10 },
  roleText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#161A1D', marginTop: 8 },
  userMeta: { fontSize: 13, color: '#767676', marginTop: 2 },
  reportCounter: { fontSize: 13, fontWeight: '600', color: '#9B2247', marginTop: 6 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: '#DDD', elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#611232' },
  sectionSubtitle: { fontSize: 12, color: '#767676', marginBottom: 12, marginTop: 2 },
  rowText: { fontSize: 14, fontWeight: '600', color: '#434343' },
  inputLabel: { fontSize: 13, color: '#767676', marginTop: 10, marginBottom: 4, fontWeight: '500' },
  textInput: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14, color: '#161A1D' },
  checkboxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#611232', borderColor: '#611232' },
  checkmark: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  radioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD' },
  radioChecked: { backgroundColor: '#611232', borderColor: '#611232' },
  actionContainer: { marginTop: 16, alignItems: 'center' },
  logoutButton: { paddingVertical: 14, marginTop: 8, width: '100%', alignItems: 'center' },
  logoutText: { color: '#9B2247', fontSize: 15, fontWeight: '700' },
});