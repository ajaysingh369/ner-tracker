import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) fetchNotifications();
  }, [visible]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const athleteId = await AsyncStorage.getItem('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://ner-tracker.vercel.app";
      const res = await fetch(`${API_URL}/notifications?userId=${athleteId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const markAsRead = async (notifId: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://ner-tracker.vercel.app";
      await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId })
      });
      setNotifications(prev => prev.map(n => n.SK === notifId ? { ...n, isRead: true } : n));
    } catch (e) { console.log(e); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#1c1c28', '#08080a']} style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Astra AI Nudges</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {loading ? (
                <ActivityIndicator size="large" color="#ff7a00" style={{marginTop: 50}} />
              ) : notifications.length > 0 ? (
                notifications.map((n, idx) => (
                  <TouchableOpacity key={idx} style={[styles.notifCard, !n.isRead && styles.unreadCard]} onPress={() => markAsRead(n.SK)}>
                    <View style={styles.notifIconBg}>
                       <Ionicons 
                        name={n.type === 'ZENITH' ? 'flash' : n.type === 'GOAL' ? 'flag' : 'heart'} 
                        size={20} color="#ff7a00" 
                       />
                    </View>
                    <View style={styles.notifText}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifMessage}>{n.message}</Text>
                      <Text style={styles.notifTime}>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    {!n.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                   <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.05)" />
                   <Text style={styles.emptyText}>All caught up! No new nudges.</Text>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { height: '80%', width: '100%' },
  content: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scrollBody: { paddingBottom: 50 },
  notifCard: { flexDirection: 'row', gap: 15, padding: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  unreadCard: { backgroundColor: 'rgba(255,122,0,0.05)', borderColor: 'rgba(255,122,0,0.1)' },
  notifIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,122,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  notifText: { flex: 1 },
  notifTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  notifMessage: { color: '#a0a0ab', fontSize: 13, lineHeight: 18, marginTop: 4 },
  notifTime: { color: '#444455', fontSize: 10, fontWeight: '700', marginTop: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff7a00' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444455', fontSize: 14, fontWeight: '700', marginTop: 15 }
});
