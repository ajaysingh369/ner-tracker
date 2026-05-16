import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'global' | 'challenge'>('global');
  const [globalData, setGlobalLeaderboard] = useState<any[]>([]);
  const [challengeData, setChallengeLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const endpoint = activeTab === 'global' ? '/leaderboard/global' : '/leaderboard/challenge';
      const res = await fetch(`${API_URL}${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'global') setGlobalLeaderboard(data.leaderboard || []);
        else setChallengeLeaderboard(data.leaderboard || []);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const renderTopThree = (data: any[]) => {
    if (data.length < 1) return null;
    const top3 = data.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((user, idx) => {
          if (!user) return <View key={idx} style={styles.podiumEmpty} />;
          const isFirst = user === top3[0];
          return (
            <View key={idx} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
              <View style={[styles.avatarContainer, isFirst && styles.avatarFirst]}>
                <Image 
                  source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.userName}&background=ff7a00&color=fff` }} 
                  style={styles.podiumAvatar} 
                />
                <View style={[styles.podiumRankBadge, isFirst && styles.podiumRankFirst]}>
                   <Text style={styles.podiumRankText}>{user === top3[0] ? '1' : user === top3[1] ? '2' : '3'}</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{user.userName.split(' ')[0]}</Text>
              <Text style={styles.podiumScore}>
                {activeTab === 'global' ? `${(user.steps / 1000).toFixed(1)}k` : `${user.progress}%`}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#1c1d2e', '#0d0d16']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hall of Fame</Text>
        <Text style={styles.subtitle}>Celebrating RunAstra Legends</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'global' && styles.activeTab]} 
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>Global Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'challenge' && styles.activeTab]} 
          onPress={() => setActiveTab('challenge')}
        >
          <Text style={[styles.tabText, activeTab === 'challenge' && styles.activeTabText]}>Challenges</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(); }} tintColor="#ff7a00" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#ff7a00" style={{marginTop: 50}} />
        ) : (
          <View style={styles.content}>
            {renderTopThree(activeTab === 'global' ? globalData : challengeData)}
            
            <View style={styles.list}>
              {(activeTab === 'global' ? globalData : challengeData).slice(3).map((user, idx) => (
                <View key={idx} style={styles.rankItem}>
                  <View style={styles.rankLeft}>
                    <Text style={styles.rankNumber}>#{idx + 4}</Text>
                    <Image 
                      source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.userName}&background=333&color=fff` }} 
                      style={styles.listAvatar} 
                    />
                    <Text style={styles.userName}>{user.userName}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={styles.scoreText}>
                      {activeTab === 'global' ? `${user.steps?.toLocaleString()}` : `${user.progress}%`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            {(activeTab === 'global' ? globalData : challengeData).length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="medal-outline" size={64} color="rgba(255,255,255,0.05)" />
                    <Text style={styles.emptyText}>The race is heating up. Be the first to join the leaderboard!</Text>
                </View>
            )}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 80, paddingHorizontal: 25, marginBottom: 20 },
  title: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#666677', fontWeight: '500' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 25, gap: 12, marginBottom: 30 },
  tab: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  activeTab: { backgroundColor: '#ff7a00', borderColor: '#ff7a00' },
  tabText: { color: '#8e8e9e', fontWeight: '800', fontSize: 13 },
  activeTabText: { color: '#000' },
  scrollContent: { paddingHorizontal: 25 },
  content: { flex: 1 },
  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 40, paddingTop: 20 },
  podiumItem: { alignItems: 'center', width: width * 0.25 },
  podiumFirst: { width: width * 0.3, marginBottom: 15 },
  podiumEmpty: { width: width * 0.25 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarFirst: { transform: [{ scale: 1.2 }] },
  podiumAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: 'rgba(255,255,255,0.1)' },
  podiumRankBadge: { position: 'absolute', bottom: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#8e8e9e', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0d0d16' },
  podiumRankFirst: { backgroundColor: '#ff7a00', width: 26, height: 26, borderRadius: 13 },
  podiumRankText: { color: '#000', fontSize: 10, fontWeight: '900' },
  podiumName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  podiumScore: { color: '#ff7a00', fontSize: 12, fontWeight: '900', marginTop: 2 },
  list: { gap: 10 },
  rankItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankNumber: { color: '#444455', fontWeight: '900', width: 30, fontSize: 14 },
  listAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222' },
  userName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  rankRight: { },
  scoreText: { color: '#a0a0ab', fontWeight: '900', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444455', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 15 }
});
