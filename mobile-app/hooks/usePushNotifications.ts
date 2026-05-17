import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export function usePushNotifications() {
  const router = useRouter();

  useEffect(() => {
    requestUserPermission();
    
    // 1. Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'RunAstra Insight',
        remoteMessage.notification?.body,
        [
          { text: 'View Coach', onPress: () => router.push('/explore') },
          { text: 'Later', style: 'cancel' }
        ]
      );
    });

    // 2. Handle background message clicks
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🔗 Notification caused app to open from background:', remoteMessage.data);
      if (remoteMessage.data?.screen) {
        router.push(remoteMessage.data.screen as any);
      }
    });

    // 3. Handle quit-state (cold start) message clicks
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🔗 Notification caused app to open from quit state:', remoteMessage.data);
          if (remoteMessage.data?.screen) {
             // Small delay to ensure navigation is ready
             setTimeout(() => router.push(remoteMessage.data?.screen as any), 1000);
          }
        }
      });

    return unsubscribe;
  }, []);

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('🔔 Push Notifications Authorized');
      getFCMToken();
    }
  }

  async function getFCMToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('📱 FCM Token:', token);
        syncTokenWithBackend(token);
      }
    } catch (error) {
      console.log('❌ Failed to get FCM token:', error);
    }
  }

  async function syncTokenWithBackend(fcmToken: string) {
    const athleteId = await SecureStore.getItemAsync('athleteId');
    const authToken = await SecureStore.getItemAsync('authToken');
    if (!athleteId || !authToken) return;

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    try {
      await fetch(`${API_URL}/auth/fcm-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken })
      });
      console.log('✅ FCM Token synced with backend');
    } catch (e) {
      console.error('❌ Failed to sync FCM token:', e);
    }
  }
}
