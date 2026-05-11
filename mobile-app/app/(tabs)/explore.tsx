import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AICoachScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAIPlan();
  }, []);

  const fetchAIPlan = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://ner-tracker.vercel.app";
      const res = await fetch(`${API_URL}/ai/coach/plan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.log('Error fetching AI data:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleUpgrade = () => {
    Alert.alert(
      "🚀 Unlock Astra Pro",
      "Get deep tactical analysis, recovery predictions, and professional cross-training plans for the price of a coffee!",
      [
        { text: "Later", style: "cancel" },
        { text: "Go Pro", onPress: () => Alert.alert("Coming Soon", "We are setting up secure payments. Stay tuned!") }
      ]
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#ff7a00" />
        <Text style={styles.loadingText}>Analyzing your profile...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1c1d2e', '#0d0d16']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAIPlan(); }} tintColor="#ff7a00" />}
      >
        <View style={styles.header}>
          <View style={styles.coachAvatarWrapper}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9440/9440938.png' }} style={styles.coachAvatar} />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.title}>Astra AI Coach</Text>
            <Text style={styles.subtitle}>Professional Guidance for Abuja Runners</Text>
          </View>
        </View>

        {/* ── FREE TIER: Daily AI Pulse ────────────────────────────── */}
        <View style={styles.pulseCard}>
           <View style={styles.cardHeader}>
              <Ionicons name="flash" size={18} color="#ff7a00" />
              <Text style={styles.cardTitle}>DAILY AI PULSE</Text>
              <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>
           </View>
           <Text style={styles.pulseMessage}>{data?.dailyPulse?.message}</Text>
           <View style={styles.insightBox}>
              <Text style={styles.insightText}>💡 {data?.dailyPulse?.insight}</Text>
           </View>
        </View>

        {/* ── PRO TIER SECTION ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>WEEKLY MASTERPLAN</Text>
           {!data?.isPro && <Ionicons name="lock-closed" size={16} color="#666" />}
        </View>

        {data?.isPro ? (
          <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.planCard}>
             <Markdown style={markdownStyles}>
              {data.tacticalPlan}
             </Markdown>
          </LinearGradient>
        ) : (
          <TouchableOpacity activeOpacity={0.9} onPress={handleUpgrade}>
            <LinearGradient colors={['rgba(255,122,0,0.15)', 'rgba(255,122,0,0.05)']} style={styles.proTeaserCard}>
              <View style={styles.lockCircle}>
                 <Ionicons name="sparkles" size={32} color="#ff7a00" />
              </View>
              <Text style={styles.proTeaserTitle}>Go Pro for Deep Insights</Text>
              <Text style={styles.proTeaserDesc}>{data?.proTeaser}</Text>
              <View style={styles.upgradeBtn}>
                 <Text style={styles.upgradeBtnText}>Unlock Pro Masterplan</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const markdownStyles = {
  body: { color: '#e0e0e0', fontSize: 16, lineHeight: 24 },
  heading3: { color: '#ff7a00', fontWeight: '900', marginTop: 10, marginBottom: 15, fontSize: 22, textTransform: 'uppercase' },
  heading4: { color: '#fff', fontWeight: '800', marginTop: 20, marginBottom: 10, fontSize: 18 },
  strong: { color: '#ff7a00', fontWeight: 'bold' },
  list_item: { marginBottom: 10, color: '#a0a0ab' }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 40 },
  coachAvatarWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,122,0,0.1)', padding: 10 },
  coachAvatar: { width: '100%', height: '100%' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ade80', borderWidth: 2, borderColor: '#1c1d2e' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#666677', fontWeight: '600' },
  loadingBox: { flex: 1, backgroundColor: '#0d0d16', justifyContent: 'center', alignItems: 'center', gap: 15 },
  loadingText: { color: '#a0a0ab', fontWeight: '600' },
  pulseCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 40 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardTitle: { color: '#ff7a00', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  freeBadge: { backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  freeText: { color: '#4ade80', fontSize: 8, fontWeight: '900' },
  pulseMessage: { color: '#fff', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  insightBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  insightText: { color: '#a0a0ab', fontSize: 13, fontStyle: 'italic' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  planCard: { padding: 25, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  proTeaserCard: { padding: 35, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,122,0,0.2)' },
  lockCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,122,0,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  proTeaserTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  proTeaserDesc: { color: '#a0a0ab', textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 30 },
  upgradeBtn: { backgroundColor: '#ff7a00', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 16 },
  upgradeBtnText: { color: '#000', fontWeight: '900', fontSize: 14 }
});
