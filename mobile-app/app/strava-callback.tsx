import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function StravaCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // A fallback in case the _layout.tsx deep link handler misses it.
    // Replace to the main tabs immediately after the callback screen mounts.
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff7a00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a24',
    justifyContent: 'center',
    alignItems: 'center',
  },
});