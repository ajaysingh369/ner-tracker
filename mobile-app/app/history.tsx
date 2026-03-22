import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';

type RangeType = 'weekly' | 'monthly' | 'yearly';

export default function HistoryScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeType>('weekly');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    fetchHistoryData();
  }, [range]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const athleteId = await AsyncStorage.getItem('athleteId');
      if (!athleteId) {
        console.warn('No athlete ID found for history');
        setLoading(false);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.8:3003";
      const res = await fetch(`${API_URL}/api/mobile/history?athleteId=${athleteId}&range=${range}`);
      const json = await res.json();

      if (json.success && json.data) {
        processChartData(json.data, range);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: any[], currentRange: RangeType) => {
    // We format data for react-native-chart-kit
    let labels: string[] = [];
    let values: number[] = [];

    if (data.length === 0) {
      // Empty mock state
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      values = [0, 0, 0, 0, 0, 0, 0];
    } else {
      if (currentRange === 'weekly') {
        // Data format: { _id: { date: '2026-03-21' }, totalSteps: 5000 }
        data.forEach((d) => {
          const dt = new Date(d._id.date);
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          labels.push(days[dt.getDay()]);
          values.push(d.totalSteps);
        });
      } else if (currentRange === 'monthly') {
        // Data format: { _id: { year: '2026', month: '03' }, totalSteps: ... }
        data.forEach((d) => {
          labels.push(`${d._id.month}/${d._id.year.substring(2)}`);
          values.push(d.totalSteps);
        });
      } else {
        // Yearly
        data.forEach((d) => {
          labels.push(d._id.year);
          values.push(d.totalSteps);
        });
      }

      // Cap at 7 visible points for UX
      if (labels.length > 7) {
        labels = labels.slice(-7);
        values = values.slice(-7);
      }
    }

    setChartData({
      labels,
      datasets: [
        {
          data: values
        }
      ]
    });
  };

  return (
    <LinearGradient colors={['#1c1d2e', '#131422', '#0d0d16']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Step History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Toggle Range */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, range === 'weekly' && styles.toggleActive]}
            onPress={() => setRange('weekly')}
          >
            <Text style={[styles.toggleText, range === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, range === 'monthly' && styles.toggleActive]}
            onPress={() => setRange('monthly')}
          >
            <Text style={[styles.toggleText, range === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, range === 'yearly' && styles.toggleActive]}
            onPress={() => setRange('yearly')}
          >
            <Text style={[styles.toggleText, range === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
          </TouchableOpacity>
        </View>

        {/* Chart Area */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Overview</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#ff7a00" style={{ marginVertical: 50 }} />
          ) : chartData ? (
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 60}
              height={280}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: '#242538',
                backgroundGradientTo: '#242538',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 122, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  stroke: 'rgba(255,255,255,0.05)',
                  strokeDasharray: '0',
                }
              }}
              style={{
                marginVertical: 10,
                borderRadius: 16,
              }}
              showBarTops={false}
              fromZero={true}
            />
          ) : (
            <Text style={{color: '#fff', textAlign: 'center', marginTop: 50}}>No data available yet.</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#00E5FF" />
          <Text style={styles.infoText}>
            This data is aggregated from your phone's secure Health Connect vault, completely seamlessly without active tracking.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#ff7a00',
    shadowColor: '#ff7a00',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  toggleText: {
    color: '#8b8b99',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#242538',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'flex-start',
  },
  infoText: {
    color: '#00E5FF',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  }
});
