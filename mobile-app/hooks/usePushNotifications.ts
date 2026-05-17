import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import * as SecureStore from 'expo-secure-store';

export function usePushNotifications() {
  useEffect(() => {
    requestUserPermission();
    
    // Listen to foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'RunAstra Insight',
        remoteMessage.notification?.body
      );
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
