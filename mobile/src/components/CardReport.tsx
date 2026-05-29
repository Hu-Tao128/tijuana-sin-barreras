import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface CardReportProps {
  title: string;
  description: string;
  status: 'pending' | 'confirmed' | 'resolved';
  location: string;
  onPress?: () => void;
}

export default function CardReport({ title, description, status, location, onPress }: CardReportProps) {
  
  // Mapeo adaptado a la identidad de la app con contenedores (Badges)
  const statusConfig = {
    pending: { 
      text: 'Pendiente', 
      textColor: '#767676', // --Neutro-Neutro-600
      bgColor: '#F3F3F3'    // --Neutro-Neutro-300
    },
    confirmed: { 
      text: 'Confirmado', 
      textColor: '#9B2247', // --Primarios-Guinda-500
      bgColor: '#FDECEF'    // Variación muy clara del guinda para fondo del badge
    },
    resolved: { 
      text: 'Resuelto', 
      textColor: '#FFF',    // --Neutro-Neutro-100
      bgColor: '#611232'    // --Presidencia-principal-600
    }
  };

  const config = statusConfig[status];

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      disabled={!onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        
        {/* Badge Dinámico */}
        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
          <Text style={[styles.statusText, { color: config.textColor }]}>
            {config.text}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{description}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.location} numberOfLines={1}>📍 {location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD', // --Neutro-Neutro-400 (Le da estructura antes de la sombra)
    // Sombras sutiles integradas con tu negro neutro
    elevation: 3,
    shadowColor: '#161A1D', // --Neutro-Neutro-800
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#161A1D', // --Neutro-Neutro-800
    flex: 1, 
    marginRight: 12,
    letterSpacing: -0.2
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20, // Forma de píldora moderna
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '700',
  },
  description: { 
    fontSize: 14, 
    color: '#434343', // --Neutro-Neutro-700 (Mayor contraste para lectura fluida)
    marginBottom: 14, 
    lineHeight: 20 
  },
  footer: { 
    borderTopWidth: 1, 
    borderTopColor: '#F3F3F3', // --Neutro-Neutro-300
    paddingTop: 10, 
  },
  location: { 
    fontSize: 13, 
    color: '#767676', // --Neutro-Neutro-600
    fontWeight: '500' 
  },
});