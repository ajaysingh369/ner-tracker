import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

interface BottomSheetNoticeProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'info' | 'warning';
    onClose: () => void;
    buttonText?: string;
    onButtonPress?: () => void;
}

export default function BottomSheetNotice({ 
    visible, 
    title, 
    message, 
    type = 'info', 
    onClose, 
    buttonText = 'Got it',
    onButtonPress 
}: BottomSheetNoticeProps) {
    const translateY = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: height,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [visible, height]);

    const getIcon = () => {
        switch (type) {
            case 'error': return { name: 'alert-circle', color: '#ff453a' };
            case 'success': return { name: 'checkmark-circle', color: '#4ade80' };
            case 'warning': return { name: 'warning', color: '#fbbf24' };
            default: return { name: 'information-circle', color: '#0a84ff' };
        }
    };

    const icon = getIcon();

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View style={{ flex: 1, opacity: visible ? 1 : 0 }} />
            </Pressable>
            
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                <BlurView intensity={100} tint="dark" style={styles.blur}>
                    <View style={styles.handle} />
                    
                    <View style={styles.content}>
                        <View style={[styles.iconBg, { backgroundColor: `${icon.color}1A` }]}>
                            <Ionicons name={icon.name as any} size={32} color={icon.color} />
                        </View>
                        
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        
                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: icon.color }]} 
                            onPress={onButtonPress || onClose}
                        >
                            <Text style={styles.buttonText}>{buttonText}</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#1c1d2e',
    },
    blur: {
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 20,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    iconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        color: '#a0a0ab',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
    }
});
