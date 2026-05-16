import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAstraTheme } from '../hooks/useAstraTheme';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface StravaActivity {
    id: number;
    name: string;
    distance: number;
    type: string;
    startDate: string;
    movingTime: number;
    averageSpeed: number;
    totalElevationGain: number;
}

export default function StravaDashboard() {
    const { colors } = useAstraTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState<StravaActivity[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            if (!refreshing) setLoading(true);
            const userId = await SecureStore.getItemAsync('athleteId');
            const token = await SecureStore.getItemAsync('authToken');
            if (!userId) return;

            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/strava/activities?userId=${userId}&per_page=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const json = await res.json();
            if (json.status === 'success') {
                setActivities(json.activities);
            }
        } catch (e) {
            console.error('Strava Dashboard Fetch Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    // ── Calendar Logic ────────────────────────────────────────────────────────

    const calendarDays = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];
        // Pad empty days
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Fill days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                date: dateStr,
                activities: activities.filter(a => a.startDate.startsWith(dateStr))
            });
        }
        return days;
    }, [activities]);

    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const stats = useMemo(() => {
        const thisMonth = activities.filter(a => {
            const d = new Date(a.startDate);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const totalDist = thisMonth.reduce((acc, curr) => acc + curr.distance, 0);
        const types = thisMonth.reduce((acc: any, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});
        
        const favType = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'None');

        return {
            totalDist: totalDist.toFixed(1),
            count: thisMonth.length,
            favType
        };
    }, [activities]);

    const selectedActivities = useMemo(() => {
        return activities.filter(a => a.startDate.startsWith(selectedDate));
    }, [activities, selectedDate]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
    };

    const getActivityIcon = (type: string) => {
        switch(type) {
            case 'Run': return 'bicycle'; // Fallback
            case 'Ride': return 'bicycle';
            case 'Walk': return 'walk';
            case 'Yoga': return 'body';
            default: return 'fitness';
        }
    };

    return (
        <LinearGradient colors={colors.background as any} style={styles.container}>
            <Stack.Screen options={{ 
                headerShown: true, 
                title: 'Strava Dashboard',
                headerTransparent: true,
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '900' }
            }} />

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Monthly Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>DISTANCE</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalDist}</Text>
                        <Text style={styles.statUnit}>KM THIS MONTH</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>ACTIVITIES</Text>
                        <Text style={styles.statValue}>{stats.count}</Text>
                        <Text style={styles.statUnit}>SESSIONS</Text>
                    </View>
                </View>

                {/* Calendar View */}
                <View style={styles.calendarCard}>
                    <Text style={styles.monthHeader}>{monthName.toUpperCase()}</Text>
                    
                    <View style={styles.weekDaysRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {calendarDays.map((d, i) => {
                            if (!d) return <View key={i} style={styles.calendarDayEmpty} />;
                            
                            const isSelected = d.date === selectedDate;
                            const hasActivity = d.activities.length > 0;

                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[
                                        styles.calendarDay,
                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedDate(d.date);
                                    }}
                                >
                                    <Text style={[
                                        styles.dayNumber,
                                        isSelected && { color: '#000', fontWeight: '900' },
                                        hasActivity && !isSelected && { color: colors.primary }
                                    ]}>
                                        {d.day}
                                    </Text>
                                    {hasActivity && (
                                        <View style={[styles.activityDot, isSelected && { backgroundColor: '#000' }]} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Selected Day Details */}
                <View style={styles.detailsSection}>
                    <Text style={styles.detailsTitle}>
                        {selectedDate === new Date().toISOString().split('T')[0] ? 'TODAY' : selectedDate}
                    </Text>

                    {selectedActivities.length > 0 ? (
                        selectedActivities.map((act) => (
                            <View key={act.id} style={styles.activityCard}>
                                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}22` }]}>
                                    <Ionicons 
                                        name={act.type === 'Run' ? 'trail-sign' : act.type === 'Ride' ? 'bicycle' : 'walk'} 
                                        size={24} 
                                        color={colors.primary} 
                                    />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>{act.name}</Text>
                                    <View style={styles.activityMeta}>
                                        <Text style={styles.metaText}>{act.distance} km</Text>
                                        <Text style={styles.metaDivider}>•</Text>
                                        <Text style={styles.metaText}>{formatTime(act.movingTime)}</Text>
                                    </View>
                                </View>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeText}>{act.type.toUpperCase()}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyDay}>
                            <Text style={styles.emptyDayText}>No activities recorded for this day.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {loading && !refreshing && (
                <View style={styles.fullLoader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Fetching your Strava journey...</Text>
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 120, paddingHorizontal: 20 },
    statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    statValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
    statUnit: { color: '#666', fontSize: 10, fontWeight: '700', marginTop: 2 },
    calendarCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 30 },
    monthHeader: { color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
    weekDayText: { color: '#444', fontSize: 12, fontWeight: '900', width: 40, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    calendarDay: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
    calendarDayEmpty: { width: 40, height: 40, marginBottom: 10 },
    dayNumber: { color: '#666', fontSize: 14, fontWeight: '600' },
    activityDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ff7a00', marginTop: 2, position: 'absolute', bottom: 6 },
    detailsSection: { marginTop: 10 },
    detailsTitle: { color: '#666', fontSize: 12, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
    activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 24, marginBottom: 12 },
    iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    activityInfo: { flex: 1 },
    activityName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: '#888', fontSize: 13, fontWeight: '500' },
    metaDivider: { color: '#444' },
    typeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeText: { color: '#aaa', fontSize: 10, fontWeight: '800' },
    emptyDay: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333' },
    emptyDayText: { color: '#444', fontSize: 14, fontWeight: '600' },
    fullLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,8,10,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    loadingText: { color: '#666', marginTop: 20, fontWeight: '600', letterSpacing: 1 }
});
