import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Button, StyleSheet, SafeAreaView } from 'react-native';
import MainTabNavigator from './navigation/MainTabNavigator';
import AuthNavigator from './navigation/AuthNavigator';

export default function App() {
  // Simulador de estado de Firebase: false = no logueado, true = logueado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        {isAuthenticated ? (
          <MainTabNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>

      {/* BOTÓN TEMPORAL DE CONTROL DE FLUJO (Eliminar al conectar Firebase) */}
      <View style={styles.devTrigger}>
        <Button 
          title={isAuthenticated ? "Simular Logout" : "Simular Login Exitoso"} 
          color={isAuthenticated ? "#ff3b30" : "#34c759"}
          onPress={() => setIsAuthenticated(!isAuthenticated)} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  devTrigger: {
    position: 'absolute',
    bottom: 70, // Posicionado arriba del menú de pestañas para pruebas
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 5,
    elevation: 10,
  }
});