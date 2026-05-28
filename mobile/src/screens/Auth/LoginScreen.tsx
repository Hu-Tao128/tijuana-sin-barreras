import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  SafeAreaView, 
  Alert, 
  StatusBar 
} from 'react-native';

// 1. Importamos tus componentes reutilizables rediseñados
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado opcional para probar el ActivityIndicator

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos.');
      return;
    }

    setIsLoading(true);

    // Simulando la futura conexión a Firebase Auth (2 segundos)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Éxito', `Iniciando sesión con: ${email}`);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />
      
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Tijuana sin Barreras</Text>
          <Text style={styles.subtitle}>Iniciar Sesión</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          {/* 2. Reemplazamos los TextInput antiguos por tu nuevo componente Input */}
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
            placeholder="Introduce tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* 3. Reemplazamos el TouchableOpacity por tu nuevo componente Button */}
          <Button
            title="Ingresar"
            onPress={handleLogin}
            variant="primary"
            isLoading={isLoading}
          />

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.6}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 4. Tu StyleSheet ahora se reduce drásticamente quitando los estilos repetidos
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F3F3', // --Neutro-Neutro-300
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
    marginTop: 8, // Pequeño espacio extra antes de los inputs
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