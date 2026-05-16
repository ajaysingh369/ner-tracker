import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    city?: string;
    height?: number;
    weight?: number;
    dailyStepGoal?: number;
    isProUser?: boolean;
    onboardingComplete?: boolean;
}

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data.user);
            }
        } catch (e) {
            console.error('Failed to fetch profile:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, refreshProfile: fetchProfile, isPro: profile?.isProUser === true };
}
