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
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// 1. Importamos tus componentes reutilizables rediseñados
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Usamos este estado para ambos flujos

  // Login con Correo y Contraseña Real (Firebase)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // Nota: El cambio de estado de autenticación lo maneja App.tsx, no necesitas navegar manualmente aquí.
    } catch (error: any) {
      Alert.alert('Error de ingreso', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Google Real (Firebase + Google Sign-In)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        // 1. En las nuevas versiones, signIn() devuelve un objeto con la propiedad 'data'
        const response = await GoogleSignin.signIn();
        
        // 2. Extraemos de forma segura el idToken desde 'data'
        const idToken = response.data?.idToken;

        if (!idToken) {
        throw new Error("No se pudo obtener el ID Token de Google (data es null o no contiene idToken)");
        }

        // 3. Crear la credencial de Firebase e iniciar sesión
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(googleCredential);

    } catch (error: any) {
        Alert.alert('Error con Google', error.message);
    } finally {
        setIsLoading(false);
    }
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
          {/* Inputs de texto */}
          <Input
            label="Correo electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Input
            label="Contraseña"
            placeholder="Introduce tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {/* Botón de Ingreso Tradicional */}
          <Button
            title="Ingresar"
            onPress={handleLogin}
            variant="primary"
            isLoading={isLoading}
          />

          {/* Botón de Google (Añadido con una variante secundaria/outline si tu componente lo soporta) */}
          <View style={styles.googleSpacer}>
            <Button
              title="Iniciar sesión con Google"
              onPress={handleGoogleLogin}
              variant="secondary" // Cambia a "outline" o el nombre que maneje tu componente para botones secundarios
              isLoading={isLoading}
            />
          </View>

          {/* Enlace de Registro */}
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.6}
            disabled={isLoading}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F3F3', 
    justifyContent: 'center', 
    padding: 24 
  },
  card: { 
    backgroundColor: '#FFF', 
    paddingHorizontal: 24, 
    paddingVertical: 32,
    borderRadius: 16, 
    elevation: 4, 
    shadowColor: '#161A1D', 
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
    color: '#611232', 
    textAlign: 'center', 
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#434343', 
    textAlign: 'center',
    fontWeight: '500'
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#9B2247', 
    borderRadius: 2,
    marginTop: 12,
  },
  form: {
    width: '100%',
    marginTop: 8, 
  },
  googleSpacer: {
    marginTop: 12, // Separación elegante entre el botón primario y el de Google
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: { 
    color: '#767676', 
    fontSize: 14, 
  },
  linkTextBold: {
    color: '#9B2247', 
    fontWeight: '700',
  }
});