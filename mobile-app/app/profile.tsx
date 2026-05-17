import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator, Switch, Modal, FlatList, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAstraTheme, AstraTheme } from '../hooks/useAstraTheme';
import { useUserProfile } from '../hooks/useUserProfile';
import BottomSheetNotice from '../components/BottomSheetNotice';

export default function ProfileScreen() {
  const { profile, isPro, refreshProfile } = useUserProfile();
  const { theme: activeTheme, colors, setTheme } = useAstraTheme();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdatingPro, setIsUpdatingPro] = useState(false);
  const [notice, setNotice] = useState<{visible: boolean, title: string, message: string, type: 'error' | 'success' | 'info'}>({
      visible: false, title: '', message: '', type: 'info'
  });
  const router = useRouter();

  // Developer Toggle Logic: Only show for specific emails
  const isDeveloper = profile?.email === 'dev@athleon.co.in' || 
                      profile?.email === 'ajaysingh369@gmail.com' ||
                      profile?.email?.includes('@athleon.co.in');

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const toggleProPlan = async (value: boolean) => {
      setIsUpdatingPro(true);
      try {
          const token = await SecureStore.getItemAsync('authToken');
          const athleteId = await SecureStore.getItemAsync('athleteId');
          const API_URL = process.env.EXPO_PUBLIC_API_URL;
          
          console.log(`🛡️ Developer Pro Toggle: Setting ${value} for ${athleteId}`);

          const res = await fetch(`${API_URL}/auth/profile`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ isProUser: value })
          });
          
          if (res.ok) {
              setNotice({
                  visible: true,
                  title: 'Plan Updated',
                  message: `Astra Pro has been ${value ? 'enabled' : 'disabled'} for your developer account.`,
                  type: 'success'
              });
              await refreshProfile();
          } else {
              const err = await res.json();
              throw new Error(err.error || 'Failed to update');
          }
      } catch (e: any) {
          console.error('❌ Pro Toggle Error:', e);
          setNotice({
              visible: true,
              title: 'Sync Error',
              message: e.message || 'Could not update Pro status on the backend.',
              type: 'error'
          });
      } finally {
          setIsUpdatingPro(false);
      }
  };

  useEffect(() => {
    fetchStravaStatus();
  }, []);

  const fetchStravaStatus = async () => {
    try {
      const athleteId = await AsyncStorage.getItem('athleteId');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const sRes = await fetch(`${API_URL}/strava/last-activity?userId=${athleteId}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.status === 'success') setIsStravaConnected(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const validateForm = () => {
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    const stepGoal = parseInt(formData.dailyStepGoal);

    if (isNaN(height) || height < 50 || height > 300) {
      Alert.alert('Validation Error', 'Please enter a valid height between 50 and 300 cm.');
      return false;
    }
    if (isNaN(weight) || weight < 20 || weight > 500) {
      Alert.alert('Validation Error', 'Please enter a valid weight between 20 and 500 kg.');
      return false;
    }
    if (isNaN(stepGoal) || stepGoal < 1000 || stepGoal > 100000) {
      Alert.alert('Validation Error', 'Please enter a valid daily step goal between 1,000 and 100,000.');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    
    console.log('📤 Updating Profile with:', JSON.stringify(formData));
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        console.log('✅ Profile Update Successful');
        setIsEditing(false);
        fetchProfile();
      } else {
        const errText = await response.text();
        console.error('❌ Profile Update Failed:', errText);
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (e) {
      console.error('❌ Profile Update Error:', e);
    }
    setLoading(false);
  };

  const handleStravaConnect = async () => {
    const athleteId = await AsyncStorage.getItem('athleteId');
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    Linking.openURL(`${API_URL}/auth/strava?userId=${athleteId}`);
  };

  const astraThemes = [
    { name: 'Solar' as AstraTheme, colors: ['#ff7a00', '#ffb347'], icon: 'sunny' },
    { name: 'Lunar' as AstraTheme, colors: ['#94a3b8', '#334155'], icon: 'moon' },
    { name: 'Nebula' as AstraTheme, colors: ['#a855f7', '#3b82f6'], icon: 'sparkles' }
  ];

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  if (loading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#08080a' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#08080a' }]}>
      <Stack.Screen options={{ 
        title: 'Settings', 
        headerShown: true,
        headerStyle: { backgroundColor: '#08080a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false
      }} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: '#08080a' }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <Image 
            source={{ uri: profile?.profileImage || `https://ui-avatars.com/api/?name=${profile?.firstName}+${profile?.lastName}&background=${colors.primary.replace('#','')}&color=fff` }} 
            style={[styles.avatar, { borderColor: colors.primary }]} 
          />
          <Text style={styles.name}>{profile?.firstName} {profile?.lastName}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Astra Themes Selection */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Astra Themes</Text>
            <View style={styles.themeRow}>
                {astraThemes.map((t) => (
                    <TouchableOpacity 
                        key={t.name} 
                        style={[styles.themeCard, activeTheme === t.name && { borderColor: t.colors[0], backgroundColor: 'rgba(255,255,255,0.05)' }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setTheme(t.name);
                        }}
                    >
                        <LinearGradient colors={t.colors as any} style={styles.themeCircle}>
                            <Ionicons name={t.icon as any} size={16} color="#000" />
                        </LinearGradient>
                        <Text style={[styles.themeLabel, activeTheme === t.name && { color: t.colors[0], fontWeight: '900' }]}>{t.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* Health Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Physical Metrics</Text>
            <TouchableOpacity 
                style={[styles.editInline, { backgroundColor: `${colors.primary}1A` }]} 
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    isEditing ? handleUpdate() : setIsEditing(true);
                }}
            >
                <Ionicons name={isEditing ? "save" : "create-outline"} size={16} color={colors.primary} />
                <Text style={[styles.editInlineText, { color: colors.primary }]}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoGrid}>
            <TouchableOpacity 
                disabled={!isEditing} 
                style={styles.infoItem} 
                onPress={() => setShowGenderPicker(true)}
            >
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={[styles.infoValue, isEditing && { color: colors.primary }]}>{formData.gender || '--'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                disabled={!isEditing} 
                style={styles.infoItem} 
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={[styles.infoValue, isEditing && { color: colors.primary }]}>{formData.dob || '--'}</Text>
            </TouchableOpacity>

            <InfoItem colors={colors} label="City" value={formData.city} isEditing={isEditing} onChange={(v: string) => setFormData({...formData, city: v})} placeholder="e.g. Delhi" />
            <InfoItem colors={colors} label="Height (cm)" value={formData.height} isEditing={isEditing} keyboardType="numeric" onChange={(v: string) => setFormData({...formData, height: v})} />
            <InfoItem colors={colors} label="Weight (kg)" value={formData.weight} isEditing={isEditing} keyboardType="numeric" onChange={(v: string) => setFormData({...formData, weight: v})} />
            <InfoItem colors={colors} label="Daily Step Goal" value={formData.dailyStepGoal} isEditing={isEditing} keyboardType="numeric" onChange={(v: string) => setFormData({...formData, dailyStepGoal: v})} />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#fff" />
                    <Text style={styles.settingLabel}>AI Nudges</Text>
                </View>
                <Switch 
                    value={formData.aiConsent !== false} 
                    onValueChange={(val) => setFormData({...formData, aiConsent: val})}
                    trackColor={{ false: "#333", true: colors.primary }} 
                />
            </View>
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.settingLabel}>Data Sharing Consent</Text>
                </View>
                <Switch 
                    value={formData.partnerSharingConsent === true} 
                    onValueChange={(val) => setFormData({...formData, partnerSharingConsent: val})}
                    trackColor={{ false: "#333", true: colors.primary }} 
                />
            </View>
        </View>

        {/* Connectivity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Connectivity</Text>
          <View style={styles.connectCard}>
            <View style={styles.connectInfo}>
              <View style={styles.stravaIconBg}>
                <Ionicons name="bicycle" size={24} color="#fc4c02" />
              </View>
              <View>
                <Text style={styles.connectTitle}>Strava</Text>
                <Text style={styles.connectStatus}>
                  {isStravaConnected ? '✅ Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>
            {!isStravaConnected && (
              <TouchableOpacity style={styles.connectBtn} onPress={handleStravaConnect}>
                <Text style={styles.connectBtnText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Legal & Info */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL('https://www.athleon.co.in/privacy.html')}>
                <Text style={styles.infoRowText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL('https://www.athleon.co.in/terms.html')}>
                <Text style={styles.infoRowText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL('https://www.athleon.co.in')}>
                <Text style={styles.infoRowText}>Visit Website</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => { AsyncStorage.clear(); router.replace('/(auth)/login'); }}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Developer Override Section */}
        {isDeveloper && (
            <View style={styles.devSection}>
                <View style={styles.divider} />
                <Text style={styles.devTitle}>Developer Controls</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="flash" size={20} color="#ff7a00" />
                        <Text style={styles.settingLabel}>Pro Mode Override</Text>
                    </View>
                    {isUpdatingPro ? (
                        <ActivityIndicator size="small" color="#ff7a00" />
                    ) : (
                        <Switch 
                            value={isPro} 
                            onValueChange={toggleProPlan}
                            trackColor={{ false: "#333", true: "#ff7a00" }} 
                        />
                    )}
                </View>
            </View>
        )}

        <Text style={styles.versionText}>RunAstra Build v1.0.0 (MVP)</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomSheetNotice 
        visible={notice.visible}
        title={notice.title}
        message={notice.message}
        type={notice.type}
        onClose={() => setNotice({ ...notice, visible: false })}
      />

      {/* Gender Picker Modal */}
      <Modal visible={showGenderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background[0] }]}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <FlatList 
                    data={genderOptions}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.modalItem} 
                            onPress={() => {
                                setFormData({...formData, gender: item});
                                setShowGenderPicker(false);
                            }}
                        >
                            <Text style={[styles.modalItemText, formData.gender === item && { color: colors.primary, fontWeight: '800' }]}>{item}</Text>
                            {formData.gender === item && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowGenderPicker(false)}>
                    <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dob ? new Date(formData.dob) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              const formattedDate = selectedDate.toISOString().split('T')[0];
              setFormData({ ...formData, dob: formattedDate });
            }
          }}
        />
      )}
    </View>
  );
}

function InfoItem({ label, value, isEditing, onChange, colors, keyboardType = 'default', placeholder }: any) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <TextInput 
          style={[styles.infoInput, { color: colors.primary }]} 
          value={value?.toString() || ''} 
          onChangeText={onChange} 
          keyboardType={keyboardType}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor="#444"
        />
      ) : (
        <Text style={styles.infoValue}>{value || '--'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  email: { color: '#a0a0ab', fontSize: 14, marginTop: 4 },
  editToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  editToggleText: { fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  editInline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  editInlineText: { fontWeight: '700', fontSize: 13 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  infoItem: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { color: '#a0a0ab', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoInput: { fontSize: 16, fontWeight: '600', padding: 0 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeCard: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  themeCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  themeLabel: { color: '#666677', fontSize: 12, fontWeight: '800' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  connectCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  connectInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  stravaIconBg: { backgroundColor: 'rgba(252, 76, 2, 0.1)', padding: 10, borderRadius: 12 },
  connectTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  connectStatus: { color: '#a0a0ab', fontSize: 12, marginTop: 2 },
  connectBtn: { backgroundColor: '#fc4c02', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  connectBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoRowText: { color: '#a0a0ab', fontSize: 15, fontWeight: '500' },
  logoutBtn: { marginTop: 20, padding: 20, alignItems: 'center', backgroundColor: 'rgba(255, 69, 58, 0.1)', borderRadius: 20 },
  logoutText: { color: '#ff453a', fontWeight: '700', fontSize: 16 },
  versionText: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 30, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '50%' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalItemText: { color: '#a0a0ab', fontSize: 16, fontWeight: '600' },
  modalClose: { marginTop: 20, paddingVertical: 15, alignItems: 'center' },
  modalCloseText: { color: '#ff453a', fontSize: 16, fontWeight: '800' },
  devSection: { marginTop: 30, marginBottom: 20 },
  devTitle: { color: '#ff7a00', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', width: '100%', marginBottom: 20 }
});

