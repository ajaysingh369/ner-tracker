import React from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();

  if (!url) return null;

  // ── Web Platform Polyfill ────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: title || 'Challenge Details' }} />
        <iframe 
          src={url} 
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} 
          title={title}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: title || 'Challenge Details',
          headerStyle: { backgroundColor: '#0f0f13' },
          headerTintColor: '#fff',
        }} 
      />
      <WebView 
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff7a00" />
          </View>
        )}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f13',
  },
});
