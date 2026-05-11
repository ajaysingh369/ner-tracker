import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as AstraThemeProvider } from '@/hooks/useAstraTheme';

// Keep native splash visible until root layout is ready.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AstraThemeProvider>
      <RootLayoutContent />
    </AstraThemeProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // ── Deep Linking Handling ───────────────
    const handleDeepLink = (event: { url: string }) => {
      const data = Linking.parse(event.url);
      if (data.path === 'strava-callback') {
        console.log('🔗 Strava callback detected.');
        router.replace('/(tabs)');
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });

    // ── Auth & Onboarding Check ─────────────
    checkAuthAndOnboarding();

    // ── Splash Screen ────────────────────────
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(err => console.warn(err));
    }, 500);

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.user && !data.user.onboardingComplete) {
            console.log('🚀 Redirecting to onboarding...');
            router.replace('/onboarding');
          }
        }
      } else {
        console.log('🔒 No auth token found, redirecting to login...');
        router.replace('/(auth)/login');
      }
    } catch (e) { console.error(e); }
    setIsLoadingAuth(false);
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: true }} />
        <Stack.Screen name="webview" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
