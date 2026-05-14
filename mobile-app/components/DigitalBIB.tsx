import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Share, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

interface DigitalBIBProps {
  userName: string;
  activityName: string;
  distance: string;
  type: string;
  tagline: string;
  date: string;
  onClose: () => void;
  isAchievement?: boolean;
  narrative?: string;
}

export default function DigitalBIB({ userName, activityName, distance, type, tagline, date, onClose, isAchievement, narrative }: DigitalBIBProps) {
  const viewShotRef = useRef<any>(null);

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        alert('Sharing is available on native devices.');
        return;
      }

      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: isAchievement ? 'Share your RunAstra Glory' : 'Share your RunAstra Achievement',
        UTI: 'public.png',
      });
    } catch (e) {
      console.error('Share Error:', e);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <LinearGradient 
            colors={isAchievement ? ['#2d1b00', '#08080a'] : ['#1c1c28', '#08080a']} 
            style={[styles.bibCard, isAchievement && { borderColor: '#ff7a00' }]}
          >
            
            {/* Header / Brand */}
            <View style={styles.bibHeader}>
              <View>
                <Text style={styles.brandTitle}>Run<Text style={styles.highlight}>Astra</Text></Text>
                <Text style={styles.achievementLabel}>{isAchievement ? 'CHALLENGE CONQUERED' : 'OFFICIAL ACHIEVEMENT'}</Text>
              </View>
              <Ionicons name={isAchievement ? "medal" : "trophy"} size={32} color="#ff7a00" />
            </View>

            {/* AI Hero Tagline */}
            <View style={styles.taglineBox}>
              <Text style={styles.heroTagline}>"{isAchievement ? narrative : tagline}"</Text>
            </View>

            {/* User Info */}
            <View style={styles.userRow}>
              <View style={[styles.avatarPlaceholder, isAchievement && { backgroundColor: '#4ade80' }]}>
                <Text style={styles.avatarInitial}>{userName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{userName.toUpperCase()}</Text>
                <Text style={styles.activityDate}>{new Date(date).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Main Metric - The "BIB Number" Style */}
            <View style={[styles.metricContainer, isAchievement && { backgroundColor: 'rgba(74, 222, 128, 0.05)' }]}>
              <Text style={[styles.metricValue, isAchievement && { color: '#4ade80' }]}>{distance}</Text>
              <Text style={styles.metricUnit}>{type.includes('STEPS') ? 'TOTAL STEPS' : 'KILOMETERS'}</Text>
              <View style={[styles.typeBadge, isAchievement && { backgroundColor: '#4ade80' }]}>
                <Text style={styles.typeText}>{activityName.toUpperCase()}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.bibFooter}>
               <Text style={styles.footerNote}>{isAchievement ? 'Ranked Elite in the RunAstra Community' : 'Proud member of Noida Extension Runners'}</Text>
               <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={30} color="rgba(255,255,255,0.2)" />
               </View>
            </View>

            {/* Decorative Accents */}
            <View style={[styles.accentBar, { top: 0, left: 0 }, isAchievement && { backgroundColor: '#4ade80' }]} />
            <View style={[styles.accentBar, { bottom: 0, right: 0 }, isAchievement && { backgroundColor: '#4ade80' }]} />

          </LinearGradient>
        </ViewShot>

        {/* Buttons (Not part of the capture) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.shareBtn, isAchievement && { backgroundColor: '#4ade80' }]} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#000" style={{marginRight: 8}} />
            <Text style={styles.shareBtnText}>{isAchievement ? 'Share Glory' : 'Share BIB'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  container: { width: '90%', maxWidth: 400 },
  bibCard: { padding: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' },
  bibHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  brandTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  highlight: { color: '#ff7a00' },
  achievementLabel: { color: '#a0a0ab', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  taglineBox: { marginBottom: 30 },
  heroTagline: { color: '#fff', fontSize: 18, fontWeight: '700', fontStyle: 'italic', lineHeight: 24 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff7a00', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#000', fontWeight: '900', fontSize: 18 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  activityDate: { color: '#666677', fontSize: 12, fontWeight: '600' },
  metricContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, marginBottom: 30 },
  metricValue: { color: '#ff7a00', fontSize: 84, fontWeight: '900', lineHeight: 84 },
  metricUnit: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 4, marginTop: 10 },
  typeBadge: { marginTop: 20, backgroundColor: '#ff7a00', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 30 },
  typeText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bibFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  footerNote: { color: '#444455', fontSize: 10, fontWeight: '700', flex: 1 },
  qrPlaceholder: { padding: 5 },
  accentBar: { position: 'absolute', width: 100, height: 4, backgroundColor: '#ff7a00' },
  buttonRow: { flexDirection: 'row', gap: 15, marginTop: 30 },
  closeBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  closeBtnText: { color: '#fff', fontWeight: '700' },
  shareBtn: { flex: 2, backgroundColor: '#ff7a00', paddingVertical: 16, alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center' },
  shareBtnText: { color: '#000', fontWeight: '900' }
});
