import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useUserProfile } from '../hooks/useUserProfile';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MODEL_URL = 'https://assets.athleon.co.in/models/blazepose_3d.tflite'; 
const MODEL_PATH = `${(FileSystem as any).documentDirectory}blazepose_3d.tflite`;

export default function AIFormCoachModule({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const { isPro } = useUserProfile();
    const [hasPermission, setHasPermission] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [modelReady, setModelReady] = useState(false);
    
    const device = useCameraDevice('back');

    // Load model from local file once downloaded
    const model = useTensorflowModel(modelReady ? { url: `file://${MODEL_PATH}` } : (null as any), 'default' as any);

    useEffect(() => {
        (async () => {
            const status = await (Camera as any).requestCameraPermission();
            setHasPermission(status === 'granted');

            const info = await FileSystem.getInfoAsync(MODEL_PATH);
            if (info.exists) {
                setModelReady(true);
            }
        })();
    }, []);

    const downloadModel = async () => {
        setIsDownloading(true);
        const downloadResumable = FileSystem.createDownloadResumable(
            MODEL_URL,
            MODEL_PATH,
            {},
            (dp) => {
                const progress = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
                setDownloadProgress(progress);
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (result) {
                setModelReady(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Download Failed", "Check your connection and try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal animationType="slide" transparent={false} visible={visible}>
            <View style={styles.container}>
                {!modelReady ? (
                    <View style={styles.setupContainer}>
                        <LinearGradient colors={['#1a1a24', '#0f0f13']} style={StyleSheet.absoluteFill} />
                        <Ionicons name="body" size={80} color="#ff7a00" style={{ marginBottom: 20 }} />
                        <Text style={styles.title}>AI Form Coach</Text>
                        <Text style={styles.desc}>
                            Unlock pro-grade biomechanical analysis using our on-device neural engine.
                        </Text>
                        
                        {isDownloading ? (
                            <View style={styles.progressBox}>
                                <Text style={styles.progressText}>Initializing Neural Engine... {Math.round(downloadProgress * 100)}%</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]} />
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.downloadBtn} onPress={downloadModel}>
                                <LinearGradient colors={['#ff7a00', '#ff453a']} style={styles.btnGradient}>
                                    <Text style={styles.btnText}>Download AI Assets (25MB)</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.cameraContainer}>
                        {device && hasPermission ? (
                            <Camera
                                style={StyleSheet.absoluteFill}
                                device={device}
                                isActive={visible}
                            />
                        ) : (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>Camera not available or permission denied</Text>
                            </View>
                        )}
                        
                        {/* Overlay UI */}
                        <SafeAreaView style={styles.overlay}>
                            <View style={styles.topBar}>
                                <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                                    <Ionicons name="close" size={28} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.aiBadge}>
                                    <Text style={styles.aiBadgeText}>ASTRA VISION ACTIVE</Text>
                                </View>
                            </View>

                            <View style={styles.guideFrame}>
                                <View style={styles.cornerTL} />
                                <View style={styles.cornerTR} />
                                <View style={styles.cornerBL} />
                                <View style={styles.cornerBR} />
                                <Text style={styles.guideText}>Position runner within frame</Text>
                            </View>

                            <View style={styles.bottomControls}>
                                {!isPro && (
                                    <BlurView intensity={80} tint="dark" style={styles.proTeaser}>
                                        <Ionicons name="lock-closed" size={16} color="#ff7a00" />
                                        <Text style={styles.proTeaserText}>PRO PREVIEW: Gait analysis limited to 3 seconds.</Text>
                                    </BlurView>
                                )}
                                <TouchableOpacity style={styles.recordBtn}>
                                    <View style={styles.recordBtnInner} />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 10 },
    desc: { fontSize: 16, color: '#a0a0ab', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    progressBox: { width: '100%', alignItems: 'center' },
    progressText: { color: '#fff', fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
    progressBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#ff7a00' },
    downloadBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { paddingVertical: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    cancelBtn: { marginTop: 25 },
    cancelText: { color: '#555', fontWeight: '700' },
    cameraContainer: { flex: 1 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#fff' },
    overlay: { flex: 1, padding: 20, justifyContent: 'space-between' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    aiBadge: { backgroundColor: 'rgba(255, 122, 0, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 122, 0, 0.3)' },
    aiBadgeText: { color: '#ff7a00', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    guideFrame: { flex: 1, marginVertical: 60, borderWidth: 0, justifyContent: 'center', alignItems: 'center' },
    cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: 'rgba(255,255,255,0.3)', borderTopLeftRadius: 20 },
    cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: 'rgba(255,255,255,0.3)', borderTopRightRadius: 20 },
    cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: 'rgba(255,255,255,0.3)', borderBottomLeftRadius: 20 },
    cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: 'rgba(255,255,255,0.3)', borderBottomRightRadius: 20 },
    guideText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
    bottomControls: { alignItems: 'center', gap: 30, marginBottom: 20 },
    proTeaser: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
    proTeaserText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', padding: 4, justifyContent: 'center', alignItems: 'center' },
    recordBtnInner: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#ff453a' }
});
