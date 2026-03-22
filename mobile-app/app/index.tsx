import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const storedAthleteId = await AsyncStorage.getItem('athleteId');
      setIsAuthenticated(!!storedAthleteId);
    }
    checkAuth();
  }, []);

  // Show nothing while evaluating (native splash still visible behind)
  if (isAuthenticated === null) return <View style={{ flex: 1, backgroundColor: '#1a1a24' }} />;

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
}
