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
// Importamos statusCodes para atrapar cancelaciones del usuario de manera profesional 👇
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import Input from '../../components/Input';
import Button from '../../components/Button';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login con Correo y Contraseña
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      Alert.alert('Error de ingreso', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        await GoogleSignin.hasPlayServices();
        
        // 1. Iniciamos sesión de forma normal
        const response = await GoogleSignin.signIn();

        // 2. EXTRA: Forzamos a la librería a pedir los tokens directo a Android
        const tokens = await GoogleSignin.getTokens();
        
        // 3. Intentamos obtener el token de ambas fuentes posibles para no fallar
        const idToken = response.data?.idToken || tokens.idToken;

        if (!idToken) {
            // Si usamos un objeto con la propiedad 'code', tu catch lo leerá correctamente
            throw { 
            code: 'TOKEN_NOT_FOUND', 
            message: 'Google no devolvió ningún idToken. Verifica el webClientId.' 
            };
        }

        // 4. Crear la credencial de Firebase e iniciar sesión
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(googleCredential);

    } catch (error: any) {
        console.log("--- ERROR DETECTADO ---");
        // Si es un error nativo o nuestro objeto personalizado, lo imprimirá bien:
        console.log("Código:", error.code);
        console.log("Mensaje:", error.message);
        
        // Intentamos un log directo por si el JSON.stringify fallaba antes
        console.log(error); 

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log("El usuario canceló el inicio de sesión de Google");
        } else {
            Alert.alert(
                'Error con Google', 
                `Código: ${error.code || 'SIN_CODIGO'}\nMensaje: ${error.message || 'Error desconocido'}`
            );
        }
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

          <Button
            title="Ingresar"
            onPress={handleLogin}
            variant="primary"
            isLoading={isLoading}
          />

          <View style={styles.googleSpacer}>
            <Button
              title="Iniciar sesión con Google"
              onPress={handleGoogleLogin}
              variant="secondary" 
              isLoading={isLoading}
            />
          </View>

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
    marginTop: 12, 
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