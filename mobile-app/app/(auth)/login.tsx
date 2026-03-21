import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
// GoogleSignin.configure({
//   iosClientId: '<YOUR_IOS_CLIENT_ID>',
//   webClientId: '<YOUR_WEB_CLIENT_ID>', // From GCP Console
//   offlineAccess: true,
// });

export default function LoginScreen() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:3003';

      // 1. Google Native Auth (Commented out until GCP config is ready)
      /*
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      */

      // 2. Transmit to Backend - MOCK MODE FOR DEV
      const idToken = `mock_${Date.now()}`;
      
      const response = await fetch(`${API_URL}/api/v2/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const data = await response.json();

      if (data.status === 'success') {
        const userId = data.user.id;
        console.log(`✅ Google Auth successful! Logged in as: ${data.user.email} (ID: ${userId})`);
        
        await AsyncStorage.setItem('athleteId', userId); // Re-using athleteId key so Health Sync uses Google Auth ID
        await AsyncStorage.setItem('authToken', data.token);

        router.replace('/(tabs)');
      } else {
        Alert.alert('Auth Failed', data.error);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', 'Failed to reach backend server.');
    }
  };

  return (
    <LinearGradient
      colors={['#1c1c28', '#08080a']} // Extremely deep premium obsidian
      style={styles.container}
    >
      {/* Abstract Design Elements */}
      <View style={[styles.abstractCircle, { top: -100, right: -50, backgroundColor: 'rgba(255, 122, 0, 0.4)' }]} />
      <View style={[styles.abstractCircle, { bottom: -150, left: -100, backgroundColor: 'rgba(0, 176, 185, 0.3)' }]} />

      <BlurView intensity={20} style={styles.content}>
        
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
        
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abstractCircle: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    filter: 'blur(50px)', // For web rendering context, React Native achieves blur via blurred image underlays or blur layers
    opacity: 0.6,
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
    marginBottom: 25,
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
