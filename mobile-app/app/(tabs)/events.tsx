import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, Linking, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function EventsScreen() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const athleteId = await SecureStore.getItemAsync('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      const [eRes, uRes] = await Promise.all([
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/user/challenges?userId=${athleteId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (eRes.ok) {
        const eData = await eRes.json();
        const uData = uRes.ok ? await uRes.json() : { challenges: [] };
        
        const rawEvents = eData.events || [];
        const myChallenges = uData.challenges || [];

        // Map "pending" or "approved" status from user's challenges to the event list
        const processedEvents = rawEvents.map((evt: any) => {
            const myMatch = myChallenges.find((c: any) => c.challengeId === evt.SK);
            return { ...evt, myStatus: myMatch ? myMatch.status : null };
        });

        setAllEvents(processedEvents);
      }
    } catch (e) { console.log('Error fetching events:', e); }
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return allEvents;
    const query = searchQuery.toLowerCase();
    return allEvents.filter(e => 
      e.title?.toLowerCase().includes(query) || 
      e.subtitle?.toLowerCase().includes(query)
    );
  }, [allEvents, searchQuery]);

  const upcomingEvents = useMemo(() => filteredEvents.filter(e => e.status !== 'past'), [filteredEvents]);
  const pastEvents = useMemo(() => filteredEvents.filter(e => e.status === 'past'), [filteredEvents]);

  const handleJoin = async (challengeId: string) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const athleteId = await SecureStore.getItemAsync('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
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

  const openEventDetail = (evt: any) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/event-detail', params: { event: JSON.stringify(evt) } });
  };

  const renderEventCard = (evt: any, isPast: boolean) => (
    <TouchableOpacity 
        key={evt.SK} 
        style={styles.eventCardWrapper}
        activeOpacity={0.9}
        onPress={() => openEventDetail(evt)}
    >
      <LinearGradient 
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.eventCard}
      >
        <View style={styles.cardHeaderRow}>
            <View style={[styles.dateBadge, isPast && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.dateText, isPast && { color: '#a0a0ab' }]}>
                    {evt.startDate ? new Date(evt.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : evt.date}
                </Text>
            </View>
            {isPast && <View style={styles.pastBadge}><Text style={styles.pastBadgeText}>PAST</Text></View>}
            {evt.eventType === 'virtual' && <View style={[styles.typeBadge, { backgroundColor: '#3b82f622' }]}><Text style={[styles.typeBadgeText, { color: '#3b82f6' }]}>VIRTUAL</Text></View>}
        </View>
        
        <Text style={styles.eventTitle}>{evt.title}</Text>
        <Text style={styles.eventSubtitle} numberOfLines={2}>{evt.subtitle}</Text>
        
        <View style={styles.actionsRow}>
            <View style={[styles.actionBtn, styles.primaryBtn]}>
                <Text style={styles.primaryBtnText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#000" style={{marginLeft: 6}} />
            </View>
            
            {evt.photosUrl && isPast && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => openLink(evt.photosUrl)}>
                    <Ionicons name="images-outline" size={16} color="#4ade80" style={{marginRight: 6}} />
                    <Text style={[styles.secondaryBtnText, {color: '#4ade80'}]}>Photos</Text>
                </TouchableOpacity>
            )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
          
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#666677" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor="#666677"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#666677" />
                </TouchableOpacity>
            )}
          </View>
        </View>

        {upcomingEvents.length > 0 && (
            <>
                <Text style={styles.sectionHeading}>Upcoming</Text>
                <View style={styles.eventsGrid}>
                    {upcomingEvents.map(e => renderEventCard(e, false))}
                </View>
            </>
        )}

        {pastEvents.length > 0 && (
            <>
                <Text style={[styles.sectionHeading, { marginTop: 40 }]}>Recent Memories</Text>
                <View style={styles.eventsGrid}>
                    {pastEvents.map(e => renderEventCard(e, true))}
                </View>
            </>
        )}

        {filteredEvents.length === 0 && !refreshing && (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No events found matching &quot;{searchQuery}&quot;</Text>
            </View>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 15, marginTop: 25, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  sectionHeading: { color: '#ff7a00', fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 },
  eventsGrid: { gap: 15 },
  eventCardWrapper: { width: '100%' },
  eventCard: { padding: 22, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateBadge: { backgroundColor: 'rgba(255, 122, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateText: { color: '#ff7a00', fontSize: 12, fontWeight: '900' },
  pastBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pastBadgeText: { color: '#666', fontSize: 10, fontWeight: '800' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  eventTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  eventSubtitle: { color: '#8e8e9e', fontSize: 14, fontWeight: '500', marginBottom: 25 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { backgroundColor: '#fff' },
  disabledBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  secondaryBtnText: { color: '#ff7a00', fontWeight: '800', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20 }
});

