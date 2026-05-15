import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-gifted-charts';
import * as Haptics from 'expo-haptics';
import { useAstraTheme } from '../hooks/useAstraTheme';

const { width } = Dimensions.get('window');

type RangeType = 'weekly' | 'monthly' | 'yearly';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useAstraTheme();
  const [range, setRange] = useState<RangeType>('weekly');
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistoryData();
  }, [range]);

  const fetchHistoryData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const athleteId = await AsyncStorage.getItem('athleteId');
      const token = await AsyncStorage.getItem('authToken');
      if (!athleteId) return;

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/mobile/history?athleteId=${athleteId}&range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (json.success && json.data) {
        setHistoryData(json.data);
      }
    } catch (e) {
      console.log('History Fetch Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryData();
  };

  const chartData = useMemo(() => {
    if (historyData.length === 0) return [];

    return historyData.map((item, index) => {
      const date = new Date(item.date);
      let label = '';
      
      if (range === 'weekly') {
        label = date.toLocaleDateString('en-IN', { weekday: 'short' });
      } else if (range === 'monthly') {
        label = date.getDate().toString();
      } else {
        label = date.toLocaleDateString('en-IN', { month: 'short' });
      }

      const steps = item.steps || item.totalSteps || 0;
      
      return {
        value: steps,
        label: label,
        frontColor: steps >= 10000 ? colors.primary : '#444',
        gradientColor: steps >= 10000 ? colors.secondary : '#666',
        spacing: range === 'monthly' ? 8 : 25,
        labelTextStyle: { color: '#888', fontSize: 10 },
      };
    });
  }, [historyData, range, colors]);

  const stats = useMemo(() => {
    if (historyData.length === 0) return { avg: 0, total: 0, max: 0 };
    const values = historyData.map(d => d.steps || d.totalSteps || 0);
    const total = values.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(total / historyData.length),
      total,
      max: Math.max(...values)
    };
  }, [historyData]);

  return (
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Activity History',
        headerTransparent: true,
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900' }
      }} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Toggle Range */}
        <View style={styles.toggleContainer}>
          {(['weekly', 'monthly', 'yearly'] as RangeType[]).map((r) => (
            <TouchableOpacity 
              key={r}
              style={[styles.toggleBtn, range === r && { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRange(r);
              }}
            >
              <Text style={[styles.toggleText, range === r && { color: '#000', fontWeight: '900' }]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="AVERAGE" value={stats.avg.toLocaleString()} unit="steps" color={colors.primary} />
          <StatCard label="TOTAL" value={stats.total.toLocaleString()} unit="steps" color="#fff" />
        </View>

        {/* Chart Card */}
        <View style={[styles.chartCard, { borderColor: `${colors.primary}33` }]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{range.toUpperCase()} INSIGHTS</Text>
            <View style={styles.goalLegend}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Goal Met</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : historyData.length > 0 ? (
            <BarChart
              data={chartData}
              barWidth={range === 'monthly' ? 12 : 22}
              noOfSections={4}
              barBorderRadius={6}
              showGradient
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisTextStyle={{ color: '#666', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
              isAnimated
              animationDuration={500}
              height={200}
              width={width - 80}
            />
          ) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="stats-chart-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>No data synced for this period.</Text>
            </View>
          )}
        </View>

        {/* Consistency Insights */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consistency Pulse</Text>
        </View>
        <LinearGradient colors={[`${colors.primary}1A`, 'rgba(0,0,0,0)']} style={styles.insightCard}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={styles.insightText}>
                {stats.avg >= 10000 
                  ? "Elite consistency! You are maintaining an average above your daily goal." 
                  : "Keep it up! Try to increase your daily average by 500 steps this week."}
            </Text>
        </LinearGradient>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({ label, value, unit, color }: any) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statUnit}>{unit}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 120, paddingHorizontal: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 5, marginBottom: 30 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleText: { color: '#888', fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statUnit: { color: '#666', fontSize: 12, fontWeight: '700', marginTop: 2 },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 32, borderWidth: 1, marginBottom: 35 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  chartTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  goalLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#666', fontSize: 10, fontWeight: '700' },
  loaderContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { height: 200, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 15, fontWeight: '600' },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  insightCard: { flexDirection: 'row', gap: 15, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  insightText: { color: '#fff', flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500', opacity: 0.9 }
});