import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventsScreen() {
  return (
    <LinearGradient colors={['#1c1c28', '#08080a']} style={styles.container}>
      <Text style={styles.text}>Events Hub (Coming Soon)</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
