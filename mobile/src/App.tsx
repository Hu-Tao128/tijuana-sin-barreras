import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import MainTabNavigator from './navigation/MainTabNavigator';
import AuthNavigator from './navigation/AuthNavigator';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  // Definimos el estado del usuario (puedes cambiar 'any' por el tipo de Firebase si usas TypeScript estricto)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Configuración de Google
    GoogleSignin.configure({
      webClientId: '357899360076-ccmhvum5bvpf5lpk7k3pm3f98kthm8c7.apps.googleusercontent.com', 
      // El webClientId lo encuentras en tu archivo google-services.json 
      // dentro del objeto "oauth_client" que tiene el "client_type": 3
    });

    // Escuchar cambios en el estado de autenticación de Firebase
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    
    return subscriber; // Desuscribirse al desmontar
  }, [initializing]);

  if (initializing) return null; // O una pantalla de carga/spinner alternativo

  // Función de apoyo para cerrar sesión real desde el botón de desarrollo
  const handleLogout = async () => {
    try {
      await auth().signOut();
      // Opcional: también puedes desloguear de Google si lo deseas
      // await GoogleSignin.signOut(); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        {user ? <MainTabNavigator /> : <AuthNavigator />}
      </NavigationContainer>

      {/* BOTÓN TEMPORAL DE CONTROL DE FLUJO (Eliminar o comentar en producción) */}
      {user && (
        <View style={styles.devTrigger}>
          <Button 
            title="Cerrar Sesión (Firebase)" 
            color="#ff3b30"
            onPress={handleLogout} 
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  devTrigger: {
    position: 'absolute',
    bottom: 70, // Posicionado arriba del menú de pestañas para pruebas
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 5,
    elevation: 10,
    zIndex: 999, // Asegura que quede por encima de la navegación
  }
});