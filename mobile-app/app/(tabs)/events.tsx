import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function EventsScreen() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const athleteId = await AsyncStorage.getItem('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://ner-tracker.vercel.app";
      
      const [eRes, uRes] = await Promise.all([
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/user/challenges?userId=${athleteId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (eRes.ok) {
        const eData = await eRes.ok ? await eRes.json() : { events: [] };
        const uData = await uRes.ok ? await uRes.json() : { challenges: [] };
        
        const allEvents = eData.events || [];
        const myChallenges = uData.challenges || [];

        // Map "pending" or "approved" status from user's challenges to the event list
        const processedEvents = allEvents.map((evt: any) => {
            const myMatch = myChallenges.find((c: any) => c.challengeId === evt.SK);
            return { ...evt, myStatus: myMatch ? myMatch.status : null };
        });

        setUpcomingEvents(processedEvents.filter((e: any) => e.status !== 'past'));
        setPastEvents(processedEvents.filter((e: any) => e.status === 'past'));
      }
    } catch (e) { console.log('Error fetching events:', e); }
    setRefreshing(false);
  };

  const handleJoin = async (challengeId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const athleteId = await AsyncStorage.getItem('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://ner-tracker.vercel.app";
      
      const res = await fetch(`${API_URL}/challenges/join`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ userId: athleteId, challengeId })
      });

      if (res.ok) {
        Alert.alert('Request Sent', 'Your join request is pending admin approval.');
        fetchEvents();
      }
    } catch (e) { console.log(e); }
  };

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const renderEventCard = (evt: any, isPast: boolean) => (
    <View key={evt.SK} style={styles.eventCardWrapper}>
      <LinearGradient 
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.eventCard}
      >
        <View style={styles.cardHeaderRow}>
            <View style={[styles.dateBadge, isPast && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.dateText, isPast && { color: '#a0a0ab' }]}>{evt.date}</Text>
            </View>
            {isPast && <View style={styles.pastBadge}><Text style={styles.pastBadgeText}>PAST</Text></View>}
        </View>
        
        <Text style={styles.eventTitle}>{evt.title}</Text>
        <Text style={styles.eventSubtitle}>{evt.subtitle}</Text>
        
        <View style={styles.actionsRow}>
            {evt.type === 'EXTERNAL' ? (
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => openLink(evt.registrationUrl)}>
                    <Ionicons name="open-outline" size={16} color="#000" style={{marginRight: 6}} />
                    <Text style={styles.primaryBtnText}>Register (External)</Text>
                </TouchableOpacity>
            ) : !isPast && (
                <TouchableOpacity 
                    style={[styles.actionBtn, evt.myStatus ? styles.disabledBtn : styles.primaryBtn]} 
                    onPress={() => !evt.myStatus && handleJoin(evt.SK)}
                >
                    <Ionicons name={evt.myStatus === 'approved' ? 'checkmark-circle' : 'add-circle-outline'} size={16} color={evt.myStatus ? '#666' : '#000'} style={{marginRight: 6}} />
                    <Text style={[styles.primaryBtnText, evt.myStatus && {color: '#666'}]}>
                        {evt.myStatus === 'approved' ? 'Participant' : evt.myStatus === 'pending' ? 'Pending Approval' : 'Join Challenge'}
                    </Text>
                </TouchableOpacity>
            )}
            
            {evt.photosUrl && isPast && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => openLink(evt.photosUrl)}>
                    <Ionicons name="images-outline" size={16} color="#4ade80" style={{marginRight: 6}} />
                    <Text style={[styles.secondaryBtnText, {color: '#4ade80'}]}>Photos</Text>
                </TouchableOpacity>
            )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <LinearGradient colors={['#1c1d2e', '#131422', '#0d0d16']} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEvents} tintColor="#ff7a00" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Events Hub</Text>
          <Text style={styles.subtitle}>Community runs, challenges, and memories.</Text>
        </View>

        <Text style={styles.sectionHeading}>Upcoming</Text>
        <View style={styles.eventsGrid}>
          {upcomingEvents.length > 0 ? upcomingEvents.map(e => renderEventCard(e, false)) : (
            <Text style={styles.emptyText}>No upcoming events scheduled.</Text>
          )}
        </View>

        {pastEvents.length > 0 && (
            <>
                <Text style={[styles.sectionHeading, { marginTop: 40 }]}>Recent Memories</Text>
                <View style={styles.eventsGrid}>
                    {pastEvents.map(e => renderEventCard(e, true))}
                </View>
            </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 80 },
  header: { marginBottom: 30 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#a0a0ab', marginTop: 8 },
  sectionHeading: { color: '#ff7a00', fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 },
  eventsGrid: { gap: 15 },
  eventCardWrapper: { width: '100%' },
  eventCard: { padding: 22, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateBadge: { backgroundColor: 'rgba(255, 122, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateText: { color: '#ff7a00', fontSize: 12, fontWeight: '900' },
  pastBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pastBadgeText: { color: '#666', fontSize: 10, fontWeight: '800' },
  eventTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  eventSubtitle: { color: '#8e8e9e', fontSize: 14, fontWeight: '500', marginBottom: 25 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { backgroundColor: '#fff' },
  disabledBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  secondaryBtnText: { color: '#ff7a00', fontWeight: '800', fontSize: 13 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20 }
});
