import { useEffect, useState, useCallback } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeOut, ZoomIn, FadeInDown } from 'react-native-reanimated';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as AstraThemeProvider } from '@/hooks/useAstraTheme';
import { SecurityService } from '@/services/SecurityService';

// Keep native splash visible until root layout is ready.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function CustomSplash({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    // Hide native splash screen immediately so our custom one shows
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // Hold for 2.5s
    return () => clearTimeout(timer);
  }, []);

  // Web fallback: Don't use heavy reanimated sequences on web for the splash image
  // as it can cause the Metro bundler to choke on large assets during initial load.
  if (Platform.OS === 'web') {
    return (
      <Animated.View 
        exiting={FadeOut.duration(400)} 
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}
      >
        <Image 
          source={require('../assets/images/splash-icon-light.png')} 
          style={{ width: 180, height: 180 }} 
          resizeMode="contain" 
        />
        <Text style={{ color: '#a0a0ab', fontSize: 15, fontWeight: '800', marginTop: 25, letterSpacing: 3, textTransform: 'uppercase' }}>
          Move. Improve. Repeat.
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      exiting={FadeOut.duration(600)} 
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}
    >
        <Animated.Image 
           entering={ZoomIn.duration(800).springify().damping(14)} 
           source={require('../assets/images/splash-icon-light.png')} 
           style={{ width: 180, height: 180 }} 
           resizeMode="contain" 
        />
        <Animated.Text 
           entering={FadeInDown.delay(500).duration(800)} 
           style={{ color: '#a0a0ab', fontSize: 15, fontWeight: '800', marginTop: 25, letterSpacing: 3, textTransform: 'uppercase' }}
        >
          Move. Improve. Repeat.
        </Animated.Text>
    </Animated.View>
  );
}

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
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      // On web, we skip the custom native splash and just hide the Expo loader immediately
      SplashScreen.hideAsync().catch(() => {});
    }

    // 🛡️ [Security] Run production audit
    SecurityService.performSecurityCheck();

    // ── Deep Linking Handling ───────────────
    const handleDeepLink = (event: { url: string }) => {
      const data = Linking.parse(event.url);
      console.log('🔗 Received Deep Link:', data);

      if (data.path === 'strava-callback') {
        router.replace('/(tabs)');
      } else if (data.path === 'event' || (data.path && data.path.startsWith('event/'))) {
        const eventId = data.queryParams?.id || data.path.split('/')[1];
        if (eventId) {
          // If app is still loading auth, we might need a small delay or state 
          // For now, push to detail (which will handle fetching by ID)
          router.push(`/event-detail?id=${eventId}`);
        }
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });

    // ── Auth & Onboarding Check ─────────────
    checkAuthAndOnboarding();

    return () => {
      sub.remove();
    };
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
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
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: true }} />
          <Stack.Screen name="webview" options={{ headerShown: true }} />
          <Stack.Screen name="event-detail" options={{ headerShown: true }} />
        </Stack>
        {showSplash && <CustomSplash onFinish={() => setShowSplash(false)} />}
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
