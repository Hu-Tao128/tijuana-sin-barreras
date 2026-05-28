import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false 
}: ButtonProps) {
  
  const buttonStyles = [
    styles.button,
    styles[variant],
    (disabled || isLoading) && styles.disabled
  ];

  // Mapeo dinámico del color del loader según la variante
  const getLoaderColor = () => {
    if (disabled) return '#767676';
    if (variant === 'secondary') return '#611232';
    return '#FFF';
  };

  const textStyles = [
    styles.text,
    variant === 'secondary' ? styles.textSecondary : styles.textWhite,
    disabled && styles.textDisabled
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50, // 50px es excelente para emular botones institucionales limpios
    borderRadius: 8, // Consistente con el login y registro previos
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
    // Sombras sutiles usando el color neutro oscuro
    elevation: 2,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  
  // VARIANTE PRIMARIA: El guinda insignia de la app
  primary: { 
    backgroundColor: '#611232', // --Presidencia-principal-600
  },
  
  // VARIANTE SECUNDARIA: Botón sutil con borde, fondo claro y texto guinda
  secondary: { 
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderWidth: 1.5, 
    borderColor: '#611232', // --Presidencia-principal-600
    elevation: 0, // Los botones outline se ven mejor planos
    shadowOpacity: 0,
  },
  
  // VARIANTE DANGER: Un rojo quemado que no rompa drásticamente con la escala de los guindas
  danger: { 
    backgroundColor: '#9B2247' // --Primarios-Guinda-500 (sirve perfecto para alertas sin ser un rojo chillón)
  },
  
  // ESTADO DESACTIVADO: Gris institucional plano
  disabled: { 
    backgroundColor: '#DDD', // --Neutro-Neutro-400
    borderColor: '#DDD', 
    elevation: 0,
    shadowOpacity: 0,
  },
  
  // ESTILOS DE TEXTO
  text: { 
    fontSize: 16, 
    fontWeight: '700', // Un peso fuerte ('bold') le da presencia institucional
    letterSpacing: 0.3 
  },
  textWhite: { 
    color: '#FFF' // --Neutro-Neutro-100
  },
  textSecondary: { 
    color: '#611232' // --Text-Text-primary-enabled
  },
  textDisabled: {
    color: '#767676' // --Neutro-Neutro-600
  }
});