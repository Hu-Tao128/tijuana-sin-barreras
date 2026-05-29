import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import ReportDetailScreen from '../screens/Report/ReportDetailScreen';
import MyReportsScreen from '../screens/Report/MyReportsScreen';

const Stack = createNativeStackNavigator();


export default function MainStackNavigator() {
  return (
    <Stack.Navigator
      id="main_stack"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#161A1D',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
        },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'Detalle del Reporte' }}
      />
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ title: 'Mis Reportes' }}
      />
    </Stack.Navigator>
  );
}
