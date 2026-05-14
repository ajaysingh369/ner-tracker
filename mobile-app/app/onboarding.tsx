import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: '',
    dob: '',
    height: '',
    weight: '',
    dailyStepGoal: '10000',
    aiConsent: false,
    partnerSharingConsent: false
  });
  const router = useRouter();

  const handleNext = () => {
    if (step === 1 && !formData.gender) return Alert.alert('Selection Required', 'Please select your gender.');
    if (step === 2 && !formData.dob) return Alert.alert('Required', 'Please enter your Date of Birth.');
    if (step === 3 && (!formData.height || !formData.weight)) return Alert.alert('Required', 'Please enter height and weight.');
    if (step === 4 && !formData.dailyStepGoal) return Alert.alert('Required', 'Please set your daily step target.');
    if (step === 5 && (!formData.aiConsent)) return Alert.alert('Consent Required', 'Please agree to AI insights to continue.');
    
    if (step < 5) setStep(step + 1);
    else submitOnboarding();
  };

  const submitOnboarding = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...formData, 
          onboardingComplete: true 
        })
      });

      if (response.ok) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LinearGradient colors={['#1c1c28', '#08080a']} style={styles.container}>
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.progressBar, { backgroundColor: i <= step ? '#ff7a00' : 'rgba(255,255,255,0.1)' }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepView}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Help us personalize your fitness goals.</Text>
            <View style={styles.optionRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.optionCard, formData.gender === g && styles.optionSelected]} 
                  onPress={() => setFormData({ ...formData, gender: g })}
                >
                  <Text style={[styles.optionText, formData.gender === g && styles.optionTextSelected]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepView}>
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.subtitle}>Used for metabolic calculations.</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: formData.dob ? '#fff' : '#666', fontSize: 18 }}>
                {formData.dob || 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.dob ? new Date(formData.dob) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
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
        )}

        {step === 3 && (
          <View style={styles.stepView}>
            <Text style={styles.title}>Metrics</Text>
            <Text style={styles.subtitle}>Your height and current weight.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={formData.height}
                onChangeText={(v) => setFormData({ ...formData, height: v })}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={formData.weight}
                onChangeText={(v) => setFormData({ ...formData, weight: v })}
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepView}>
            <Text style={styles.title}>Your Daily Goal</Text>
            <Text style={styles.subtitle}>How many steps do you want to achieve every day?</Text>
            <View style={styles.optionRow}>
              {['5000', '8000', '10000', '12000', '15000'].map((goal) => (
                <TouchableOpacity 
                  key={goal} 
                  style={[styles.optionCard, formData.dailyStepGoal === goal && styles.optionSelected]} 
                  onPress={() => setFormData({ ...formData, dailyStepGoal: goal })}
                >
                  <Text style={[styles.optionText, formData.dailyStepGoal === goal && styles.optionTextSelected]}>{goal} Steps</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { marginTop: 20 }]}>Or enter custom goal</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={formData.dailyStepGoal}
              onChangeText={(v) => setFormData({ ...formData, dailyStepGoal: v })}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepView}>
            <Text style={styles.title}>Your Privacy</Text>
            <Text style={styles.subtitle}>How we use your data.</Text>
            
            <TouchableOpacity 
              style={styles.consentRow} 
              onPress={() => setFormData({ ...formData, aiConsent: !formData.aiConsent })}
            >
              <Ionicons name={formData.aiConsent ? "checkbox" : "square-outline"} size={24} color={formData.aiConsent ? "#ff7a00" : "#666"} />
              <Text style={styles.consentText}>I agree to use my data for AI-powered health insights.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.consentRow} 
              onPress={() => setFormData({ ...formData, partnerSharingConsent: !formData.partnerSharingConsent })}
            >
              <Ionicons name={formData.partnerSharingConsent ? "checkbox" : "square-outline"} size={24} color={formData.partnerSharingConsent ? "#ff7a00" : "#666"} />
              <Text style={styles.consentText}>I agree to share my progress data with Noida Extension Runners partners.</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>{step === 5 ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { flexDirection: 'row', paddingTop: 60, px: 20, gap: 8, marginHorizontal: 20 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  content: { padding: 30, paddingTop: 40 },
  stepView: { flex: 1 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#a0a0ab', marginBottom: 40 },
  optionRow: { flexDirection: 'column', gap: 15 },
  optionCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  optionSelected: { borderColor: '#ff7a00', backgroundColor: 'rgba(255,122,0,0.1)' },
  optionText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  optionTextSelected: { color: '#ff7a00' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 18, color: '#fff', fontSize: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#a0a0ab', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12 },
  consentText: { color: '#fff', flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { padding: 30, paddingBottom: 50, flexDirection: 'row', gap: 15 },
  nextButton: { flex: 1, backgroundColor: '#ff7a00', padding: 18, borderRadius: 16, alignItems: 'center' },
  nextText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  backButton: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  backText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});
