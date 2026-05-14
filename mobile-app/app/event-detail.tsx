import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import RenderHtml from 'react-native-render-html';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const event = params.event ? JSON.parse(params.event as string) : null;

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event details not found.</Text>
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
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.eventType === 'virtual' ? 'VIRTUAL EVENT' : 'ON-GROUND EVENT'}</Text>
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
  hero: { marginBottom: 35 },
  categoryBadge: { backgroundColor: 'rgba(255, 122, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 122, 0, 0.2)' },
  categoryText: { color: '#ff7a00', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
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
  errorContainer: { flex: 1, backgroundColor: '#0d0d16', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#a0a0ab', fontSize: 16 }
});
