import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { STRIDE_GUARD_TASK } from '../scripts/StrideGuardTask';
import { useUserProfile } from './useUserProfile';
import { FeatureFlags } from '../constants/FeatureFlags';

export function useStrideGuard() {
    const { isPro } = useUserProfile();
    const [isActive, setIsActive] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        const registered = await TaskManager.isTaskRegisteredAsync(STRIDE_GUARD_TASK);
        setIsActive(registered);
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const startStrideGuard = async () => {
        if (!isPro) {
            Alert.alert("RunAstra Pro Required", "Acoustic Stride Guard is a premium feature. Please upgrade to Pro to enable active injury prevention.");
            return;
        }

        const { status: foreground } = await Location.requestForegroundPermissionsAsync();
        if (foreground !== 'granted') {
            Alert.alert("Permission Error", "Location access is required to track distance for Stride Guard.");
            return;
        }

        const { status: background } = await Location.requestBackgroundPermissionsAsync();
        if (background !== 'granted') {
            Alert.alert("Background Access Required", "Stride Guard needs background location access to monitor your form even when the screen is off.");
            return;
        }

        const { status: mic } = await Audio.requestPermissionsAsync();
        if (mic !== 'granted') {
            Alert.alert("Microphone Access Required", "Stride Guard needs microphone access to analyze your running acoustics for injury prevention.");
            return;
        }

        setPermissionStatus('granted');

        try {
            await Location.startLocationUpdatesAsync(STRIDE_GUARD_TASK, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 60000, // Every minute
                distanceInterval: 100, // or every 100 meters
                foregroundService: {
                    notificationTitle: "Stride Guard Active",
                    notificationBody: "Monitoring your running form for safety.",
                    notificationColor: "#ff7a00"
                }
            });
            setIsActive(true);
        } catch (e) {
            console.error('Failed to start Stride Guard:', e);
        }
    };

    const stopStrideGuard = async () => {
        await Location.stopLocationUpdatesAsync(STRIDE_GUARD_TASK);
        setIsActive(false);
    };

    return {
        isActive,
        isSupported: FeatureFlags.ENABLE_STRIDE_GUARD,
        startStrideGuard,
        stopStrideGuard,
        isPro
    };
}
