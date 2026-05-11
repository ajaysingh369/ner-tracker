import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FuelSyncModalProps {
  visible: boolean;
  onClose: () => void;
  lastActivity: any;
  userProfile: any;
}

export default function FuelSyncModal({ visible, onClose, lastActivity, userProfile }: FuelSyncModalProps) {
  const [mealText, setMealText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'recovery' | 'log'>('recovery');

  const handleLogMeal = async () => {
    if (!mealText) return;
    setIsSaving(true);
    try {
      const athleteId = await AsyncStorage.getItem('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      const res = await fetch(`${API_URL}/nutrition/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: athleteId, meal: mealText, activityId: lastActivity?.id })
      });

      if (res.ok) {
        Alert.alert('Meal Logged', 'Our AI and upcoming dieticians will analyze this for your next plan!');
        setMealText('');
        setActiveTab('recovery');
      }
    } catch (e) { console.log(e); }
    setIsSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={['#1c1c28', '#08080a']} style={styles.content}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Fuel-Sync Pro</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity onPress={() => setActiveTab('recovery')} style={[styles.tab, activeTab === 'recovery' && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === 'recovery' && styles.activeTabText]}>Recovery Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('log')} style={[styles.tab, activeTab === 'log' && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === 'log' && styles.activeTabText]}>Log Intake</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {activeTab === 'recovery' ? (
                <>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>BURNED</Text>
                      <Text style={styles.statValue}>{lastActivity?.fuelSync?.caloriesBurned || 0} kcal</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>BMR EST.</Text>
                      <Text style={styles.statValue}>{lastActivity?.fuelSync?.bmrEstimate || 0} kcal</Text>
                    </View>
                  </View>

                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="sparkles" size={20} color="#ff7a00" />
                      <Text style={styles.adviceTitle}>AI NUTRITIONIST TIPS</Text>
                    </View>
                    <Text style={styles.adviceText}>{lastActivity?.fuelSync?.tip}</Text>
                  </View>

                  <TouchableOpacity style={styles.proBanner} onPress={() => Alert.alert('Coming Soon', 'Certified Noida Runners Dieticians are joining soon for personal 1-on-1 coaching!')}>
                    <LinearGradient colors={['#ff7a00', '#ffb347']} style={styles.proGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
                      <Ionicons name="medal" size={24} color="#000" />
                      <View style={styles.proText}>
                        <Text style={styles.proTitle}>HIRE A CERTIFIED PRO</Text>
                        <Text style={styles.proSub}>Personalized meal plans & daily guidance.</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#000" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.logContainer}>
                   <Text style={styles.logLabel}>What did you eat after your run?</Text>
                   <TextInput 
                      style={styles.input} 
                      placeholder="e.g. 2 Eggs, 1 Banana and a Bowl of Oats" 
                      placeholderTextColor="#444" 
                      multiline
                      numberOfLines={4}
                      value={mealText}
                      onChangeText={setMealText}
                   />
                   <TouchableOpacity style={styles.saveBtn} onPress={handleLogMeal} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Log</Text>}
                   </TouchableOpacity>
                   <Text style={styles.logNote}>This data helps our AI understand your recovery patterns better.</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: { height: '85%', width: '100%' },
  content: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, marginBottom: 30 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#666677', fontWeight: '800', fontSize: 13 },
  activeTabText: { color: '#000' },
  scrollBody: { paddingBottom: 50 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: '#666677', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  adviceCard: { backgroundColor: 'rgba(255,122,0,0.08)', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,122,0,0.15)', marginBottom: 30 },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  adviceTitle: { color: '#ff7a00', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  adviceText: { color: '#fff', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  proBanner: { borderRadius: 20, overflow: 'hidden' },
  proGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  proText: { flex: 1 },
  proTitle: { color: '#000', fontSize: 14, fontWeight: '900' },
  proSub: { color: '#000', fontSize: 11, fontWeight: '600', opacity: 0.7, marginTop: 2 },
  logContainer: { gap: 20 },
  logLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, color: '#fff', fontSize: 16, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#ff7a00', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  logNote: { color: '#666', fontSize: 12, textAlign: 'center', lineHeight: 18 }
});
