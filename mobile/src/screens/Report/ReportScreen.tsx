import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de reportes (reports)</Text>
      <Text style={styles.subtext}>Tijuana sin Barreras</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  text: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtext: { fontSize: 16, color: '#666', marginTop: 5 }
});