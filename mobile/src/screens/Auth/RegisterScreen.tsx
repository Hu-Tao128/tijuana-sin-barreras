import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  StatusBar 
} from 'react-native';

// 1. Importamos tus componentes reutilizables rediseñados
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar el ActivityIndicator

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);

    // Simulando el flujo futuro con Firebase Auth + Firestore (2 segundos)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Éxito', `Registrando a: ${name}`);
      // Aquí podrías redirigir al Home o Login automáticamente
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate como Ciudadano</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.form}>
            {/* 2. Sustituimos los antiguos bloques por tu componente Input customizado */}
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Correo electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Contraseña"
              placeholder="Crea una contraseña segura"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* 3. Reemplazamos por tu componente Button */}
            <Button
              title="Registrarse"
              onPress={handleRegister}
              variant="primary"
              isLoading={isLoading}
            />

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.6}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 4. Se depuran los estilos duplicados heredados por los subcomponentes
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F3F3' // --Neutro-Neutro-300
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 24 
  },
  card: { 
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    paddingHorizontal: 24, 
    paddingVertical: 32,
    borderRadius: 16, 
    elevation: 4, 
    shadowColor: '#161A1D', // --Neutro-Neutro-800
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12 
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#611232', // --Primarios-Guinda-600
    textAlign: 'center', 
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#434343', // --Neutro-Neutro-700
    textAlign: 'center',
    fontWeight: '500'
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#9B2247', // --Primarios-Guinda-500
    borderRadius: 2,
    marginTop: 12,
  },
  form: {
    width: '100%',
    marginTop: 8,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: { 
    color: '#767676', // --Neutro-Neutro-600
    fontSize: 14, 
  },
  linkTextBold: {
    color: '#9B2247', // --Primarios-Guinda-500
    fontWeight: '700',
  }
});