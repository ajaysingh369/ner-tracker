import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RenderHtml from 'react-native-render-html';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(params.event ? JSON.parse(params.event as string) : null);
  const [loading, setLoading] = useState(!event);

  useEffect(() => {
    if (!event && params.id) {
        fetchEventById(params.id as string);
    }
  }, [params.id]);

  const fetchEventById = async (id: string) => {
    try {
        setLoading(true);
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/events/${id}`);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.event) {
                setEvent(data.event);
            }
        }
    } catch (e) {
        console.error('Fetch Event Detail Error:', e);
    } finally {
        setLoading(false);
    }
  };

  const shareToWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const eventId = event.SK || event.id;
    const shareUrl = `https://athleon.co.in/event?id=${eventId}`;
    const message = `Check out this event on RunAstra: *${event.title}*! \n\nJoin me here: ${shareUrl}`;
    const encodedMessage = encodeURIComponent(message);
    Linking.openURL(`whatsapp://send?text=${encodedMessage}`).catch(() => {
        // Fallback to web link if WhatsApp not installed
        Linking.openURL(`https://wa.me/?text=${encodedMessage}`);
    });
  };

  if (loading) {
    return (
        <LinearGradient colors={['#1c1d2e', '#0d0d16']} style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff7a00" />
            <Text style={styles.loaderText}>Syncing event intelligence...</Text>
        </LinearGradient>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff453a" />
        <Text style={styles.errorText}>Event details not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: '#ff7a00', fontWeight: '800' }}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const isPast = event.status === 'past';
  const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : event.date;
  const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <LinearGradient colors={['#1c1d2e', '#0d0d16']} style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Event Details',
        headerTransparent: true,
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900' }
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{event.eventType === 'virtual' ? 'VIRTUAL EVENT' : 'ON-GROUND EVENT'}</Text>
            </View>
            <TouchableOpacity style={styles.shareIconBtn} onPress={shareToWhatsApp}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.shareText}>SHARE</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.subtitle}>{event.subtitle}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={18} color="#ff7a00" />
              <Text style={styles.metaText}>{startDate}{endDate && endDate !== startDate ? ` - ${endDate}` : ''}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={18} color="#ff7a00" />
              <Text style={styles.metaText}>{event.eventType === 'virtual' ? 'Anywhere' : 'Local Venue'}</Text>
            </View>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
           {event.registrationUrl && !isPast && (
             <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#ff7a00' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  openLink(event.registrationUrl);
                }}
             >
               <Text style={styles.mainActionText}>REGISTER NOW</Text>
             </TouchableOpacity>
           )}
           {event.photosUrl && isPast && (
             <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#4ade80' }]}
                onPress={() => openLink(event.photosUrl)}
             >
               <Ionicons name="images" size={20} color="#000" style={{marginRight: 8}} />
               <Text style={styles.mainActionText}>VIEW PHOTOS</Text>
             </TouchableOpacity>
           )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Event</Text>
          <View style={styles.descriptionBox}>
            {event.description ? (
              <RenderHtml
                contentWidth={width - 50}
                source={{ html: `<div style="color: #a0a0ab; line-height: 24px; font-size: 16px;">${event.description}</div>` }}
              />
            ) : (
              <Text style={styles.emptyText}>No description provided.</Text>
            )}
          </View>
        </View>

        {/* Omni-Engine Rules Section */}
        {event.rules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Rules & Logic</Text>
            <View style={styles.rulesContainer}>
              {event.rules.dailyMax && (
                <View style={styles.ruleItem}>
                  <Ionicons name="speedometer-outline" size={20} color="#ff7a00" />
                  <View>
                    <Text style={styles.ruleLabel}>Daily Cap</Text>
                    <Text style={styles.ruleValue}>Max {event.rules.dailyMax} {event.metric === 'STEPS' ? 'Steps' : 'KM'} / day</Text>
                  </View>
                </View>
              )}
              {event.rules.minActiveDays > 0 && (
                <View style={styles.ruleItem}>
                  <Ionicons name="calendar-outline" size={20} color="#ff7a00" />
                  <View>
                    <Text style={styles.ruleLabel}>Consistency</Text>
                    <Text style={styles.ruleValue}>Min {event.rules.minActiveDays} Active Days required</Text>
                  </View>
                </View>
              )}
              {event.rules.dailyMin > 0 && (
                <View style={styles.ruleItem}>
                  <Ionicons name="flag-outline" size={20} color="#ff7a00" />
                  <View>
                    <Text style={styles.ruleLabel}>Active Threshold</Text>
                    <Text style={styles.ruleValue}>Min {event.rules.dailyMin} {event.metric === 'STEPS' ? 'Steps' : 'KM'} to count as active</Text>
                  </View>
                </View>
              )}
              {event.rules.allowRankSurge && (
                <View style={styles.ruleItem}>
                  <Ionicons name="trending-up-outline" size={20} color="#ff7a00" />
                  <View>
                    <Text style={styles.ruleLabel}>Rank Surge Enabled</Text>
                    <Text style={styles.ruleValue}>Keep accumulating data even after 100%</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Categories Section */}
        {event.categories && event.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Categories</Text>
            <View style={styles.categoryList}>
              {event.categories.map((cat: any, i: number) => (
                <View key={i} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.catNameText}>{cat.name}</Text>
                    <Text style={styles.catGoalText}>{cat.goal.toLocaleString()} {event.metric === 'STEPS' ? 'Steps' : 'KM'}</Text>
                  </View>
                  <Ionicons name="trophy" size={20} color="rgba(255,122,0,0.4)" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Flyer/Template Section */}
        {event.flyerTemplateUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participation BIB/Flyer</Text>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => openLink(event.flyerTemplateUrl)}
              style={styles.flyerCard}
            >
              <Image source={{ uri: event.flyerTemplateUrl }} style={styles.flyerImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.flyerOverlay}>
                <Ionicons name="download-outline" size={24} color="#fff" />
                <Text style={styles.flyerDownloadText}>Download Template</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 120, paddingHorizontal: 25 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#666', marginTop: 15, fontWeight: '700', letterSpacing: 1 },
  hero: { marginBottom: 35 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  categoryBadge: { backgroundColor: 'rgba(255, 122, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 122, 0, 0.2)' },
  categoryText: { color: '#ff7a00', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  shareIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37, 211, 102, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(37, 211, 102, 0.2)' },
  shareText: { color: '#25D366', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#8e8e9e', fontSize: 18, fontWeight: '500', marginTop: 8, lineHeight: 26 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 25 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionBar: { marginBottom: 40 },
  mainAction: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  mainActionText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  section: { marginBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20 },
  descriptionBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  flyerCard: { width: '100%', height: 200, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  flyerImage: { width: '100%', height: '100%' },
  flyerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flyerDownloadText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  rulesContainer: { gap: 15 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  ruleLabel: { color: '#666677', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  ruleValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  categoryList: { gap: 12 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,122,0,0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,122,0,0.1)' },
  categoryInfo: { flex: 1 },
  catNameText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  catGoalText: { color: '#ff7a00', fontSize: 14, fontWeight: '700', marginTop: 4 },
  errorContainer: { flex: 1, backgroundColor: '#0d0d16', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#a0a0ab', fontSize: 16, marginTop: 10 }
});
