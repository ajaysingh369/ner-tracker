import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useStrideGuard } from '../hooks/useStrideGuard';

const { width } = Dimensions.get('window');

export default function StrideGuardDetailScreen() {
    const { isActive, startStrideGuard, stopStrideGuard, isPro } = useStrideGuard();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ 
                title: 'Stride Guard',
                headerShown: true,
                headerTransparent: true,
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '900' }
            }} />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient colors={['rgba(74, 222, 128, 0.2)', 'transparent']} style={styles.heroGlow} />
                
                <View style={styles.headerIcon}>
                    <Ionicons name="shield-checkmark" size={80} color="#4ade80" />
                </View>

                <Text style={styles.heroTitle}>Injury Prevention via Acoustic AI</Text>
                <Text style={styles.heroDesc}>
                    Stride Guard uses your phone's microphone to analyze the "thud" of your footfalls. 
                    Our neural engine detects asymmetry and fatigue before you feel the pain.
                </Text>

                <View style={styles.featureGrid}>
                    <FeatureItem icon="pulse" title="Fatigue Analysis" desc="Detects when your landing gets heavy as you tire." />
                    <FeatureItem icon="git-compare" title="Asymmetry Alert" desc="Identifies if one leg is striking harder than the other." />
                    <FeatureItem icon="notifications" title="Real-time Nudges" desc="Voice feedback to adjust your form mid-run." />
                </View>

                {!isPro && (
                    <View style={styles.proBox}>
                        <LinearGradient colors={['#ff7a00', '#ff453a']} style={styles.proGradient}>
                            <Ionicons name="sparkles" size={24} color="#fff" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.proTitle}>Unlock Full Protection</Text>
                                <Text style={styles.proDesc}>Free users get 1km of guard. Pro users get 100% coverage.</Text>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                <View style={styles.actionSection}>
                    <TouchableOpacity 
                        style={[styles.mainBtn, isActive ? styles.stopBtn : styles.startBtn]} 
                        onPress={isActive ? stopStrideGuard : startStrideGuard}
                    >
                        <Text style={styles.mainBtnText}>{isActive ? 'Deactivate Guard' : 'Activate Stride Guard'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.statusNote}>
                        {isActive ? 'Acoustic monitoring is active in the background.' : 'Ready to monitor your next run.'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function FeatureItem({ icon, title, desc }: any) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={20} color="#ff7a00" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemDesc}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#08080a' },
    scrollContent: { padding: 30, paddingTop: 120 },
    heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
    headerIcon: { alignItems: 'center', marginBottom: 20 },
    heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
    heroDesc: { color: '#a0a0ab', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    featureGrid: { gap: 25, marginBottom: 40 },
    featureItem: { flexDirection: 'row', gap: 15, alignItems: 'flex-start' },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,122,0,0.1)', justifyContent: 'center', alignItems: 'center' },
    itemTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    itemDesc: { color: '#666677', fontSize: 14, lineHeight: 20 },
    proBox: { borderRadius: 24, overflow: 'hidden', marginBottom: 40 },
    proGradient: { padding: 25, flexDirection: 'row', alignItems: 'center', gap: 20 },
    proTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    proDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
    actionSection: { alignItems: 'center' },
    mainBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
    startBtn: { backgroundColor: '#4ade80' },
    stopBtn: { backgroundColor: 'rgba(255,69,58,0.2)', borderWhidth: 1, borderColor: '#ff453a' },
    mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    statusNote: { color: '#444', fontSize: 12, fontWeight: '600' }
});
