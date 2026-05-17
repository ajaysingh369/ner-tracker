import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ActivityIndicator, Alert, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useUserProfile } from '../hooks/useUserProfile';

const { width } = Dimensions.get('window');

export default function ZenithVoiceModule() {
    const { isPro, loading: profileLoading } = useUserProfile();
    const [modalVisible, setModalVisible] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timer, setTimer] = useState(15);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (recording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            pulseAnim.stopAnimation();
        }
    }, [recording]);

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                const response = await requestPermission();
                if (response.status !== 'granted') {
                    Alert.alert(
                        'Microphone Required', 
                        'RunAstra needs microphone access to analyze your vocal biomarkers for recovery status.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() }
                        ]
                    );
                    return;
                }
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(recording);
            setTimer(15);
            setResult(null);
            setIsAnalyzing(false);

            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        stopRecording(recording);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async (activeRecording = recording) => {
        if (!activeRecording) return;
        
        try {
            if (timerRef.current) clearInterval(timerRef.current);
            await activeRecording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            setRecording(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            const uri = activeRecording.getURI();
            console.log('🎤 Audio saved to:', uri);
            
            analyzeAudio(uri);
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    };

    const analyzeAudio = async (uri: string | null) => {
        setIsAnalyzing(true);
        // Simulate network/AI processing delay
        setTimeout(() => {
            setIsAnalyzing(false);
            if (isPro) {
                setResult({
                    readiness: 82,
                    insight: "Your vocal biomarkers show a 12% drop in respiratory readiness compared to yesterday. You are slightly under-recovered. Downgrading today's Zenith goal to a light 5K is recommended."
                });
            } else {
                setResult({
                    readiness: '??',
                    insight: "Upgrade to RunAstra Pro to unlock full vocal biomarker analysis and recovery predictions.",
                    isPreview: true
                });
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 3000);
    };

    const closeAndReset = () => {
        setModalVisible(false);
        if (recording) stopRecording();
        setTimeout(() => {
            setResult(null);
            setTimer(15);
            setIsAnalyzing(false);
        }, 500);
    };

    return (
        <>
            {/* The Custom Tab Bar Button */}
            <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setModalVisible(true);
                }}
                style={styles.tabButton}
            >
                <LinearGradient colors={['#ff7a00', '#ff453a']} style={styles.tabButtonInner}>
                    <Ionicons name="sparkles" size={28} color="#fff" />
                    {!isPro && !profileLoading && (
                        <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={10} color="#fff" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* The Full Screen Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeAndReset}
            >
                <View style={styles.fullScreenOverlay}>
                    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                        <View style={styles.modalContainer}>
                            <TouchableOpacity style={styles.closeBtn} onPress={closeAndReset}>
                                <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>

                            <View style={styles.headerArea}>
                                <Text style={styles.title}>Zenith Voice Scan</Text>
                                {!isPro && !profileLoading && (
                                    <View style={styles.proBadge}>
                                        <Text style={styles.proBadgeText}>PRO PREVIEW</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.subtitle}>Analyzing vocal biomarkers for fatigue & recovery</Text>

                            <View style={styles.orbContainer}>
                                {recording && (
                                    <Animated.View style={[styles.orbPulse, { transform: [{ scale: pulseAnim }] }]} />
                                )}
                                <TouchableOpacity 
                                    activeOpacity={0.9} 
                                    style={[styles.orb, recording && styles.orbActive]}
                                    onPress={recording ? () => stopRecording() : startRecording}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Ionicons name={recording ? "stop" : "mic"} size={48} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statusArea}>
                                {recording && <Text style={styles.timerText}>00:{timer < 10 ? `0${timer}` : timer}</Text>}
                                {!recording && !isAnalyzing && !result && (
                                    <Text style={styles.instructionText}>Tap the orb and say:{"\n"}"Hey Astra, I'm ready for my run."</Text>
                                )}
                                {isAnalyzing && <Text style={styles.instructionText}>Extracting acoustic features...</Text>}
                                
                                {result && (
                                    <View style={styles.resultCard}>
                                        <View style={styles.scoreRow}>
                                            <Text style={styles.scoreLabel}>Readiness Score</Text>
                                            <Text style={[styles.scoreValue, { color: result.isPreview ? '#666' : (result.readiness > 80 ? '#4ade80' : '#fbbf24') }]}>
                                                {result.readiness}%
                                            </Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <Text style={[styles.insightText, result.isPreview && styles.previewText]}>
                                            {result.insight}
                                        </Text>
                                        
                                        {result.isPreview && (
                                            <TouchableOpacity 
                                                style={styles.upgradeBtn}
                                                onPress={() => { setModalVisible(false); Linking.openURL('https://www.athleon.co.in'); }}
                                            >
                                                <LinearGradient 
                                                    colors={['#ff7a00', '#ff453a']} 
                                                    start={{x: 0, y: 0}} 
                                                    end={{x: 1, y: 0}}
                                                    style={styles.upgradeBtnGradient}
                                                >
                                                    <Text style={styles.upgradeBtnText}>Unlock Pro Analytics</Text>
                                                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    tabButton: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff7a00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    tabButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#0d0d16',
    },
    lockBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: '#0d0d16', 
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 5,
    },
    proBadge: {
        backgroundColor: '#ff7a00',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    proBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a0a0ab',
        textAlign: 'center',
        marginBottom: 60,
        paddingHorizontal: 20,
    },
    orbContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    orbPulse: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 122, 0, 0.3)',
    },
    orb: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1c1d2e',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff7a00',
        shadowColor: '#ff7a00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
    },
    orbActive: {
        backgroundColor: '#ff453a',
        borderColor: '#ff453a',
        shadowColor: '#ff453a',
    },
    statusArea: {
        height: 220,
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
    },
    timerText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#ff453a',
        fontVariant: ['tabular-nums'],
    },
    instructionText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 24,
    },
    resultCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        width: width - 40,
        borderWidth: 1,
        borderColor: 'rgba(255,122,0,0.2)',
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scoreLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    insightText: {
        color: '#a0a0ab',
        fontSize: 14,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    previewText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        fontStyle: 'normal',
        marginBottom: 20,
    },
    upgradeBtn: {
        marginTop: 5,
        borderRadius: 12,
        overflow: 'hidden',
    },
    upgradeBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    upgradeBtnText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    }
});
