import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importamos tus pantallas
import HomeScreen from '../screens/Home/HomeScreen';
import MapScreen from '../screens/Map/MapScreen';
import ReportScreen from '../screens/Report/ReportScreen';
import RouteScreen from '../screens/Route/RouteScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Color del botón seleccionado
        tabBarInactiveTintColor: '#8E8E93', // Color de botones inactivos
        headerStyle: { backgroundColor: '#007AFF' }, // Color de la barra superior
        headerTintColor: '#fff', // Color del texto superior
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Mapa Urbano' }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen} 
        options={{ title: 'Reportar Barrera' }}
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