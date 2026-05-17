import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '711450684323-i0eipeflennfe9q6i9aldh9a2mhffk0r.apps.googleusercontent.com';
    GoogleSignin.configure({ 
      webClientId, 
      offlineAccess: true,
      forceCodeForRefreshToken: true 
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error('ID Token not found');
      
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const data = await response.json();

      if (data.status === 'success') {
        await SecureStore.setItemAsync('athleteId', data.user.id);
        await SecureStore.setItemAsync('authToken', data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Backend Error', data.error || 'Failed to authenticate on the server.');
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const errCode = error?.code || 'UNKNOWN';
      
      console.log('❌ Sign-In Error Code:', errCode, 'Message:', errMsg);
      
      if (errCode === '10') {
        Alert.alert(
          'Google Error (10)', 
          'This usually means your SHA-1 fingerprint does not match the one in Google Cloud Console. Please verify your release credentials.'
        );
      } else {
        Alert.alert(
          'Google Error', 
          `Code: ${errCode}\n${errMsg}\n\nPlease check your Google Cloud Console configuration.`
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandText}>Run<Text style={styles.trackerHighlight}>Astra</Text></Text>
          <Text style={styles.subText}>Move. Improve. Repeat. No premium memberships required.</Text>
        </View>

        <View style={styles.authCore}>
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={24} color="#000" style={styles.btnIcon} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.disclosureText}>
            By signing in, you agree to our Terms of Service and Privacy Policy. RunAstra securely requests permission to view your device's local pedometer data.
          </Text>
        </View>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08080a', // Solid flat color, no gradients
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 50,
  },
  header: {
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    color: '#a0a0ab',
    fontWeight: '500',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 52,
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: 55,
  },
  trackerHighlight: {
    color: '#ff7a00',
  },
  subText: {
    marginTop: 20,
    fontSize: 16,
    color: '#bbbbcc',
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.8,
  },
  authCore: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 15,
  },
  btnIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  disclosureText: {
    color: '#666677',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  }
});
