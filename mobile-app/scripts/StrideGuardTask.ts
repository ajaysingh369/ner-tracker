import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STRIDE_GUARD_TASK = 'STRIDE_GUARD_BACKGROUND_TASK';

// Shared state for the task
let lastSampleKm = 0;

TaskManager.defineTask(STRIDE_GUARD_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error('StrideGuard Task Error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        const location = locations[0];
        if (!location) return;

        // 1. Calculate cumulative distance (simplified for now)
        const savedDistanceStr = await AsyncStorage.getItem('stride_guard_total_dist');
        let totalDist = savedDistanceStr ? parseFloat(savedDistanceStr) : 0;
        
        // This is a naive increment; in production, use haversine between points
        // For POC, we'll assume the OS is giving us distance updates or we track speed
        // Let's assume we store the last lat/lon to calculate delta
        const lastLat = await AsyncStorage.getItem('stride_guard_last_lat');
        const lastLon = await AsyncStorage.getItem('stride_guard_last_lon');
        
        if (lastLat && lastLon) {
            const d = calculateDistance(
                parseFloat(lastLat), parseFloat(lastLon),
                location.coords.latitude, location.coords.longitude
            );
            totalDist += d;
        }

        await AsyncStorage.setItem('stride_guard_total_dist', totalDist.toString());
        await AsyncStorage.setItem('stride_guard_last_lat', location.coords.latitude.toString());
        await AsyncStorage.setItem('stride_guard_last_lon', location.coords.longitude.toString());

        // 2. Check if we hit a 1KM threshold
        const currentKm = Math.floor(totalDist);
        if (currentKm > lastSampleKm) {
            lastSampleKm = currentKm;
            console.log(`🏃 StrideGuard: ${currentKm}km reached. Triggering acoustic sample...`);
            triggerAcousticSample();
        }
    }
});

async function triggerAcousticSample() {
    try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
        await recording.startAsync();

        console.log('🎤 StrideGuard: Recording 15s sample...');

        // Record for 15 seconds
        setTimeout(async () => {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log('✅ StrideGuard: Sample captured:', uri);
            
            // TODO: Process URI locally with TFLite or queue for Cloud upload
            // For now, we just log it.
        }, 15000);

    } catch (e) {
        console.error('StrideGuard Audio Error:', e);
    }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
