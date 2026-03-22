import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useHealthData } from '../../hooks/useHealthData';

const { width } = Dimensions.get('window');

// SVG Ring Settings dynamically sizing to screen
const size = width * 0.85; 
const strokeWidth = 24;
const glowWidth = strokeWidth + 24; 
const radius = (size - glowWidth) / 2;
const outerRadius = radius + (strokeWidth / 2) + 6; // Thin outer ring boundary
const circumference = radius * 2 * Math.PI;

export default function HomeScreen() {
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const { dailySteps, isAuthorized, needsPermission, error, openHealthConnectForPermission } = useHealthData();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const stepGoal = 10000;
  
  const targetProgress = Math.min((dailySteps / stepGoal), 1);
  const strokeDashoffset = circumference - (circumference * targetProgress);

  // Derive physiological metrics natively from physical step array
  // Assuming average stride length = ~0.762m
  // Assuming average burn = ~0.04kcals / step
  const distanceKm = (dailySteps * 0.000762).toFixed(1);
  const caloriesKcal = Math.round(dailySteps * 0.04);

  return (
    <LinearGradient colors={['#1c1d2e', '#131422', '#0d0d16']} style={styles.container}>
      {/* Background Aura Glow */}
      <View style={styles.auraGlow} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>RunAstra</Text>
          <Text style={styles.subGreeting}>Move. Improve. Repeat.</Text>
        </View>

        {/* Permission Banner */}
        {needsPermission && (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={openHealthConnectForPermission}
          >
            <Ionicons name="fitness-outline" size={18} color="#ff7a00" />
            <Text style={styles.permissionText}>
              Tap to grant Health Connect access for step tracking
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#ff7a00" />
          </TouchableOpacity>
        )}

        {/* 1. The Hero Step Ring Area */}
        <View style={styles.ringContainer}>
          <View style={styles.svgWrapper}>
            <Svg width={size} height={size}>
              <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#ffb347" stopOpacity="1" />
                  <Stop offset="0.5" stopColor="#ff7a00" stopOpacity="1" />
                  <Stop offset="1" stopColor="#ff3b30" stopOpacity="1" />
                </SvgGradient>
              </Defs>

              {/* Thin Outer Boundary Circle */}
              <Circle 
                cx={size / 2} cy={size / 2} r={outerRadius} 
                stroke="rgba(255,255,255,0.15)" 
                strokeWidth={1.5} 
                fill="none" 
              />

              {/* Background Grey Track */}
              <Circle 
                cx={size / 2} cy={size / 2} r={radius} 
                stroke="rgba(255,255,255,0.06)" 
                strokeWidth={strokeWidth} 
                fill="none" 
              />
              
              {/* Intense "Fire" Glow Layers */}
              <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#ff3b30"
                strokeWidth={strokeWidth + 20}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                rotation="-90"
                originX={size / 2}
                originY={size / 2}
                opacity={0.15}
              />
              <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#FF8800"
                strokeWidth={strokeWidth + 10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                rotation="-90"
                originX={size / 2}
                originY={size / 2}
                opacity={0.3}
              />
              <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#ffb347"
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                rotation="-90"
                originX={size / 2}
                originY={size / 2}
                opacity={0.6}
              />

              {/* Crisp Foreground Overlay (Fire Gradient) */}
              <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="url(#grad)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                rotation="-90"
                originX={size / 2}
                originY={size / 2}
              />
            </Svg>

            <View style={styles.ringCenterText}>
              <Text style={styles.dailyStepGoalText}>DAILY STEP GOAL</Text>
              <Text style={styles.stepCount}>{dailySteps.toLocaleString()}</Text>
              <Text style={styles.stepsText}>STEPS</Text>
            </View>
          </View>
        </View>

        {/* History Link */}
        <TouchableOpacity 
          style={styles.historyLink} 
          onPress={() => router.push('/history')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyLinkText}>View Step History</Text>
          <Ionicons name="arrow-forward-circle" size={16} color="#ff7a00" />
        </TouchableOpacity>

        {/* 2. Detailed Metric Cards */}
        <View style={styles.twoCardsRow}>
          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>DISTANCE COVERED</Text>
            <View style={styles.cardValRow}>
              <Text style={styles.cardMaxVal}>{distanceKm}</Text>
              <Text style={styles.cardMinVal}> km</Text>
            </View>
            <View style={styles.cardFooter}>
              <Ionicons name="walk" size={14} color="#4ade80" />
              <Text style={styles.cardFooterText}>Daily</Text>
            </View>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>CALORIES BURNED</Text>
            <View style={styles.cardValRow}>
              <Text style={styles.cardMaxVal}>{caloriesKcal.toLocaleString()}</Text>
              <Text style={styles.cardMinVal}> kcal</Text>
            </View>
            <View style={styles.cardFooter}>
              <Ionicons name="flame" size={14} color="#fb923c" />
              <Text style={styles.cardFooterText}>Daily</Text>
            </View>
          </View>
        </View>

        {/* 3. Strava Integration Card (Restored) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Runner Sync</Text>
        </View>
        <LinearGradient 
          colors={['rgba(252, 76, 2, 0.15)', 'rgba(255, 255, 255, 0.02)']}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          style={styles.stravaCard}
        >
          {isStravaConnected ? (
            <View style={styles.stravaConnected}>
              <View style={styles.stravaHeaderRow}>
                <View style={styles.stravaIconBg}>
                  <Image source={{ uri: 'https://d3nn82uaxijpm6.cloudfront.net/apple-touch-icon-144x144.png' }} style={styles.stravaLogo} />
                </View>
                <View>
                  <Text style={styles.stravaTitle}>Morning Temp Run</Text>
                  <Text style={styles.stravaSubtext}>Synced 2 hours ago</Text>
                </View>
              </View>
              <View style={styles.stravaStatsRow}>
                <Text style={styles.recentRunText}>7.5 km</Text>
                <Text style={styles.recentRunPace}>5:40 /km</Text>
              </View>
            </View>
          ) : (
            <View style={styles.stravaNotConnected}>
              <View style={styles.stravaConnectIconArea}>
                <Ionicons name="bicycle" size={32} color="#fc4c02" />
              </View>
              <Text style={styles.stravaPrompt}>Connect Strava to automatically sync your runs and rides.</Text>
              <TouchableOpacity style={styles.stravaButton} onPress={() => setIsStravaConnected(true)} activeOpacity={0.8}>
                <Text style={styles.stravaButtonText}>Connect to Strava</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* 4. Active Challenges (Restored) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
        </View>
        <TouchableOpacity activeOpacity={0.9}>
          <LinearGradient 
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
            style={styles.eventCard}
          >
            <View style={styles.eventRowLine}>
              <Text style={styles.eventCardTitle}>🎖 March Virtual Marathon</Text>
              <Text style={styles.eventPercent}>82%</Text>
            </View>
            <View style={styles.progressBarBG}>
              <LinearGradient colors={['#ff7a00', '#ffb347']} style={[styles.progressBarFill, { width: '82%' }]} start={{x:0, y:0}} end={{x:1, y:1}} />
            </View>
            <Text style={styles.eventSubtext}>18.5 km remaining. Ends in 4 days!</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 5. Upcoming Events (Restored) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient 
              colors={['rgba(255, 122, 0, 0.15)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.upcomingCard}
            >
              <Text style={styles.upDate}>Apr 1 - Apr 30</Text>
              <Text style={styles.upTitle}>Spring Steps 2026</Text>
              <Text style={styles.upSubtitle}>Target: 150,000 Steps</Text>
              <View style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join Early</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient 
              colors={['rgba(52, 199, 89, 0.15)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.upcomingCard}
            >
              <Text style={styles.upDate}>Apr 15</Text>
              <Text style={styles.upTitle}>Earth Day 10K</Text>
              <Text style={styles.upSubtitle}>Target: 10 KM Run</Text>
              <View style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join Early</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ width: 20 }} />
        </ScrollView>

        {/* 6. Sponsor Banner (Restored) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sponsored</Text>
        </View>
        <View style={styles.sponsorBannerWrapper}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']} style={styles.sponsorBanner}>
            <View style={styles.sponsorTopRow}>
              <Text style={styles.sponsorTitle}>Niva Bupa Health Insurance</Text>
              <View style={styles.adBadge}><Text style={styles.adLabel}>AD</Text></View>
            </View>
            <Text style={styles.sponsorSub}>Get up to 20% discount on health premiums by completing your Daily Step Goals!</Text>
            <TouchableOpacity style={styles.sponsorBtn} activeOpacity={0.8}>
              <Text style={styles.sponsorBtnText}>Claim Offer</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" style={{marginLeft: 5}}/>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Spacer for bottom tab bar */}
        <View style={{ height: 120 }} />

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  auraGlow: {
    position: 'absolute',
    top: '30%',
    left: '-20%',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(255, 122, 0, 0.04)',
    filter: 'blur(80px)' as any, 
  },
  scrollContent: {
    paddingTop: 85,
    paddingHorizontal: 25,
    paddingBottom: 130, // Space for the floating bottom tabs
  },
  header: {
    marginBottom: 50,
  },
  brandTitle: {
    fontSize: 34,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 18,
    color: '#a0a0ab',
    fontWeight: '400',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyStepGoalText: {
    color: '#a0a0ab',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 5,
  },
  stepCount: {
    fontSize: 60,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: -1,
  },
  stepsText: {
    fontSize: 15,
    color: '#a0a0ab',
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 5,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    marginBottom: 20,
    padding: 10,
  },
  historyLinkText: {
    color: '#ff7a00',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  twoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  glassCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    fontSize: 10,
    color: '#90909e',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  cardValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  cardMaxVal: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '500',
  },
  cardMinVal: {
    fontSize: 14,
    color: '#a0a0ab',
    fontWeight: '500',
    marginLeft: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 13,
    color: '#90909e',
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionHeader: {
    marginBottom: 15,
    marginTop: 5,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  stravaCard: {
    width: '100%',
    padding: 24,
    borderRadius: 28,
    marginBottom: 35,
    borderColor: 'rgba(252, 76, 2, 0.3)',
    borderWidth: 1,
  },
  stravaConnected: {},
  stravaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stravaIconBg: {
    backgroundColor: 'rgba(252, 76, 2, 0.1)',
    padding: 10,
    borderRadius: 14,
    marginRight: 15,
  },
  stravaLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  stravaTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
  },
  stravaSubtext: {
    color: '#8e8e9e',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  stravaStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 18,
    borderRadius: 20,
  },
  recentRunText: {
    color: '#fc4c02',
    fontSize: 26,
    fontWeight: '900',
  },
  recentRunPace: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
  stravaNotConnected: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  stravaConnectIconArea: {
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stravaPrompt: {
    color: '#d0d0dc',
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 15,
  },
  stravaButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  stravaButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  eventCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventRowLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  eventPercent: {
    color: '#ff7a00',
    fontWeight: '900',
    fontSize: 20,
  },
  progressBarBG: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    marginTop: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    borderRadius: 6,
  },
  eventSubtext: {
    color: '#8e8e9e',
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginBottom: 35,
    overflow: 'visible',
  },
  upcomingCard: {
    width: width * 0.7,
    padding: 24,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  upDate: {
    color: '#ff7a00',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1,
  },
  upTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  upSubtitle: {
    color: '#8e8e9e',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 25,
  },
  joinBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  sponsorBannerWrapper: {
    marginBottom: 20,
  },
  sponsorBanner: {
    width: '100%',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sponsorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adLabel: {
    color: '#d0d0dc',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sponsorTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    flex: 1,
  },
  sponsorSub: {
    color: '#8e8e9e',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 22,
  },
  sponsorBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sponsorBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  permissionText: {
    flex: 1,
    color: '#ff7a00',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
