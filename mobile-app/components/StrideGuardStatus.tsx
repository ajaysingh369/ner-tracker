import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStrideGuard } from '../hooks/useStrideGuard';
import { FeatureFlags } from '../constants/FeatureFlags';

export default function StrideGuardStatus() {
    const { isActive, isSupported, startStrideGuard, stopStrideGuard, isPro } = useStrideGuard();

    if (!isSupported) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="shield-checkmark" size={20} color={isActive ? "#4ade80" : "#666"} />
                    <Text style={styles.title}>Acoustic Stride Guard</Text>
                </View>
                {!isPro && (
                    <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={isActive ? stopStrideGuard : startStrideGuard}
                style={[styles.card, isActive && styles.cardActive]}
            >
                <View style={styles.info}>
                    <Text style={styles.statusText}>
                        {isActive ? "PROTECTION ACTIVE" : "GUARD STANDBY"}
                    </Text>
                    <Text style={styles.description}>
                        {isActive 
                            ? "Analyzing footfalls for fatigue every 1km." 
                            : "Enable active injury prevention for your run."}
                    </Text>
                </View>
                
                <View style={[styles.toggle, isActive && styles.toggleActive]}>
                    <View style={[styles.knob, isActive && styles.toggleActiveKnob]} />
                </View>
            </TouchableOpacity>

            {!isPro && !isActive && (
                <Text style={styles.previewNote}>
                    Free users get a live preview during the first 1km.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    proBadge: {
        backgroundColor: '#ff7a00',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    proBadgeText: {
        color: '#000',
        fontSize: 9,
        fontWeight: '900',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardActive: {
        backgroundColor: 'rgba(74, 222, 128, 0.05)',
        borderColor: 'rgba(74, 222, 128, 0.2)',
    },
    info: {
        flex: 1,
        marginRight: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#666',
        letterSpacing: 1,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#a0a0ab',
        fontWeight: '500',
        lineHeight: 18,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#333',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#4ade80',
    },
    knob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#666',
    },
    toggleActiveKnob: {
        backgroundColor: '#fff',
        transform: [{ translateX: 20 }],
    },
    previewNote: {
        fontSize: 11,
        color: '#555',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
