import React from 'react';
import { Text, Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importamos tus pantallas
import HomeScreen from '../screens/Home/HomeScreen';
import MapScreen from '../screens/Map/MapScreen';
import ReportScreen from '../screens/Report/ReportScreen';
import RouteScreen from '../screens/Route/RouteScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Iconos para los botones estándar (excluyendo el mapa)
const getTabBarIcon = (routeName: string, focused: boolean) => {
  let icon = '';
  if (routeName === 'Home') icon = '🏠';
  else if (routeName === 'Report') icon = '⚠️';
  else if (routeName === 'Route') icon = '🛣️';
  else if (routeName === 'Profile') icon = '👤';

  return (
    <Text style={{ 
      fontSize: 20, 
      opacity: focused ? 1 : 0.6,
      color: focused ? '#611232' : '#767676' 
    }}>
      {icon}
    </Text>
  );
};

// Componente personalizado para el botón central del mapa flotante
const CustomMapTabButton = ({ onPress }: any) => (
  <TouchableOpacity
    style={styles.mapButtonContainer}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.mapButtonCircle}>
      <Text style={styles.mapButtonIcon}>🗺️</Text>
    </View>
  </TouchableOpacity>
);

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Configuración de Iconos por defecto
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
        
        tabBarActiveTintColor: '#611232', // --Presidencia-principal-600
        tabBarInactiveTintColor: '#767676', // --Neutro-Neutro-600
        
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#DDD',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 88 : 66,
          elevation: 12, // Sombra más pronunciada para soportar el botón flotante
          shadowColor: '#161A1D',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },

        headerStyle: { 
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#DDD',
        }, 
        headerTintColor: '#161A1D',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />
      
      {/* ⚠️ NOTA: Movimos "Report" aquí para que el Mapa quede exactamente en el centro (Posición 3 de 5) */}
      <Tab.Screen 
        name="Report" 
        component={ReportScreen} 
        options={{ title: 'Reportar Barrera' }}
      />

      {/* PANTALLA DE MAPA SOBRESALIENTE */}
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: 'Mapa Urbano',
          tabBarLabel: 'Mapa', // Texto más corto para balancear el diseño
          tabBarButton: (props) => <CustomMapTabButton {...props} /> // Renderiza el botón flotante
        }}
      />
      
      <Tab.Screen 
        name="Route" 
        component={RouteScreen} 
        options={{ title: 'Rutas Accesibles' }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Mi Perfil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Contenedor que rompe el flujo y eleva el botón
  mapButtonContainer: {
    top: -18, // Hace que el botón sobresalga hacia arriba de la barra
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
  },
  // Círculo llamativo con tu color de marca guinda
  mapButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#611232', // --Presidencia-principal-600
    justifyContent: 'center',
    alignItems: 'center',
    // Bordes y sombras para darle profundidad premium
    borderWidth: 3,
    borderColor: '#FFFFFF', 
    elevation: 6,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mapButtonIcon: {
    fontSize: 26, // Icono sustancialmente más grande
  },
});