import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Button, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // 👈 Importamos el tipo de usuario
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import MainStackNavigator from './navigation/MainStackNavigator';
import AuthNavigator from './navigation/AuthNavigator';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  // El tipado correcto evita usar 'any'
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    // Configuración de Google
    GoogleSignin.configure({
      webClientId: "1:357899360076:web:7caee8289c0f002ceea1e9.apps.googleusercontent.com"
    });

    // Escuchar cambios en el estado de autenticación de Firebase
    const subscriber = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    
    // Se deja el arreglo vacío [] para que solo se ejecute una vez al montar
    return subscriber; 
  }, [initializing]);

  // Cambiado de 'null' a un Spinner para que el usuario no vea una pantalla negra mientras carga
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#611232" />
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      // 1. Cerramos sesión en Firebase
      await auth().signOut();

      // 2. Cerramos sesión en Google de forma directa y segura
      try {
        await GoogleSignin.signOut();
      } catch {
        // Si el usuario no estaba logueado con Google, ignoramos el error de forma silenciosa
        console.log("No había sesión activa de Google para cerrar.");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        {user ? <MainStackNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  devTrigger: {
    position: 'absolute',
    bottom: 80, // Subido ligeramente para que libre la barra del MainTabNavigator de 66px-88px
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 5,
    elevation: 10,
    zIndex: 999,
  }
});