import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, Alert, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeInDown,
  FadeOutUp,
  useAnimatedProps,
  useAnimatedStyle
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHealthData } from '../../hooks/useHealthData';
import { useAstraTheme } from '../../hooks/useAstraTheme';
import DigitalBIB from '../../components/DigitalBIB';
import FuelSyncModal from '../../components/FuelSyncModal';
import NotificationModal from '../../components/NotificationModal';
import ZenithAvatar from '../../components/ZenithAvatar';
import Skeleton from '../../components/Skeleton';
import { MascotRenderer } from '../../components/Mascots';
import AdCard from '../../components/AdCard';

import StrideGuardStatus from '../../components/StrideGuardStatus';
import AIFormCoachModule from '../../components/AIFormCoachModule';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// SVG Ring Settings
const size = width * 0.85; 
const strokeWidth = 24;
const radius = Math.max(0, (size - (strokeWidth + 24)) / 2);
const outerRadius = Math.max(0, radius + (strokeWidth / 2) + 6);
const circumference = radius * 2 * Math.PI;

export default function HomeScreen() {
  const { colors } = useAstraTheme();
  
  // ── States with individual loading flags ──────────────────────────────
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState<any>(null);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [communityHero, setCommunityHero] = useState<any>(null);
  const [stepGoal, setStepGoal] = useState(10000);
  const [zenith, setZenith] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [completedChallenge, setCompletedChallenge] = useState<any>(null);
  const [forceZenithTrigger, setForceZenithTrigger] = useState(0);
  const lastTap = useRef(0);

  const [loadingStrava, setLoadingStrava] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingHero, setLoadingHero] = useState(true);
  
  const [showBIB, setShowBIB] = useState(false);
  const [showZenithInfo, setShowZenithInfo] = useState(false);
  const [showFuelSync, setShowFuelSync] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFormCoach, setShowFormCoach] = useState(false);
  const [greeting, setGreeting] = useState('Namaste');
  
  const { dailySteps, dailyDistance, isAuthorized, needsPermission, error, openHealthConnectForPermission, requestAuthorization } = useHealthData();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Progress logic
  const isZenithAchieved = zenith && dailySteps >= zenith.target;
  const targetProgress = Math.min((dailySteps / stepGoal), 1);
  const strokeDashoffsetValue = circumference - (circumference * targetProgress);

  // ── Reanimated Values ──────────────────────────────────────────────────
  const zenithGlow = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const ringUiOpacity = useSharedValue(1); // Controls ring text visibility

  useEffect(() => {
    zenithGlow.value = withRepeat(withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.3, { duration: 1500 })), -1, true);
    pulseScale.value = withRepeat(withSequence(withTiming(1.03, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true);
  }, []);

  const animatedGlowProps = useAnimatedProps(() => ({
    opacity: zenithGlow.value,
    strokeWidth: strokeWidth + (20 * zenithGlow.value),
    strokeDashoffset: strokeDashoffsetValue,
    strokeDasharray: circumference
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const animatedRingTextStyle = useAnimatedStyle(() => ({
    opacity: ringUiOpacity.value,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  // ── Greetings ──────────────────────────────────────────────────────────
  useEffect(() => {
    const greetings = ['Namaste', 'Sat Sri Akal', 'Vanakkam', 'Adaab', 'Pranam', 'Khamma Gani', 'Jai Jinendra', 'Radhe Radhe', 'Suprabhat', 'Kem Cho'];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const zenithProgress = zenith ? Math.min((zenith.target / stepGoal), 1) : 0.8;
  const zenithOffset = circumference - (circumference * zenithProgress);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const athleteId = await AsyncStorage.getItem('athleteId');
    if (!athleteId) return;
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    // ── Individual Data Fetches for granular loading ──────────────────────
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const safeFetch = (url: string) => fetch(url, { headers: headers as any }).then(r => r.ok ? r.json() : null).catch(() => null);

    // 1. Profile & Goal
    safeFetch(`${API_URL}/auth/me`).then(data => {
        if (data?.user) {
            setUserProfile(data.user);
            if (data.user.dailyStepGoal) setStepGoal(parseInt(data.user.dailyStepGoal));
        }
    });

    // 2. Strava & FuelSync
    safeFetch(`${API_URL}/strava/last-activity?userId=${athleteId}`).then(data => {
        if (data?.status === 'success' && data.activity) {
          setLastActivity(data.activity);
          setIsStravaConnected(true);
        } else {
          setIsStravaConnected(false);
        }
        setLoadingStrava(false);
    });

    // 3. History & Zenith
    safeFetch(`${API_URL}/mobile/history?athleteId=${athleteId}&range=weekly`).then(data => {
        if (data?.success && data.zenith) setZenith(data.zenith);
        setLoadingHistory(false);
    });

    // 4. Active Challenges
    safeFetch(`${API_URL}/user/challenges?userId=${athleteId}`).then(async data => {
        if (data?.status === 'success') {
          setActiveChallenges(data.challenges);
          
          // Check for newly completed challenges
          const completed = data.challenges.find((c: any) => c.status === 'completed');
          if (completed) {
            const celebratedKey = `celebrated_${completed.challengeId}`;
            const hasCelebrated = await AsyncStorage.getItem(celebratedKey);
            if (!hasCelebrated) {
              setCompletedChallenge(completed);
              await AsyncStorage.setItem(celebratedKey, 'true');
            }
          }
        }
        setLoadingChallenges(false);
    });

    // 5. Upcoming Events
    safeFetch(`${API_URL}/events`).then(data => {
        if (data?.status === 'success') setUpcomingEvents(data.events.filter((e: any) => e.status !== 'past'));
        setLoadingEvents(false);
    });

    // 6. Community Hero
    safeFetch(`${API_URL}/community/hero`).then(data => {
        if (data?.status === 'success') setCommunityHero(data.hero);
        setLoadingHero(false);
    });

    // 7. Banners
    safeFetch(`${API_URL}/banners`).then(data => {
        if (data?.status === 'success') setBanners(data.banners);
        setLoadingBanners(false);
    });

    setRefreshing(false);
  };

  const handleStravaConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    Linking.openURL(`${API_URL}/auth/strava?userId=${userProfile?.userId}`);
  };

  const handleRingPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 400;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setForceZenithTrigger(now);
    } else {
        lastTap.current = now;
    }
  };

  const handleChallengePress = (challenge: any) => {
    Haptics.selectionAsync();
    
    if (challenge.status === 'suggestion') {
        Alert.alert(
            "Astra Architect Recommendation",
            `${challenge.description}\n\nDo you want to accept this 7-day personalized mission?`,
            [
                { text: "Later", style: "cancel" },
                { 
                    text: "Accept Mission", 
                    onPress: async () => {
                        const token = await AsyncStorage.getItem('authToken');
                        const API_URL = process.env.EXPO_PUBLIC_API_URL;
                        const res = await fetch(`${API_URL}/challenges/join`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({ userId: userProfile.userId, challengeId: challenge.challengeId })
                        });
                        if (res.ok) {
                            Alert.alert("Mission Accepted!", "Good luck, Architect. Your progress will be tracked over the next 7 days.");
                            fetchHomeData();
                        }
                    } 
                }
            ]
        );
        return;
    }

    if (challenge.status === 'completed') {
        setCompletedChallenge(challenge);
        return;
    }
    if (challenge.type === 'WEB_TRACKER' && challenge.url) {
      router.push({ pathname: '/webview', params: { url: challenge.url, title: challenge.name } });
    }
  };

  const displayDistance = dailyDistance > 0 ? dailyDistance.toFixed(1) : (dailySteps * 0.000762).toFixed(1);
  const caloriesKcal = Math.round(dailySteps * 0.04);

  return (
    <LinearGradient colors={colors.background as any} style={styles.container}>
      <View style={[styles.auraGlow, { backgroundColor: `${colors.primary}0A` }]} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchHomeData} tintColor={colors.primary} />}
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeading}>
                <TouchableOpacity style={[styles.avatarCircle, { borderColor: colors.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/profile'); }}>
                   <Image source={{ uri: userProfile?.profileImage || `https://ui-avatars.com/api/?name=${userProfile?.firstName || 'A'}&background=${colors.primary.replace('#','')}&color=fff` }} style={styles.headerAvatar} />
                </TouchableOpacity>
                <View style={styles.greetingCol}>
                    <Text style={styles.brandTitle}>{greeting}, {userProfile?.firstName || 'Runner'}</Text>
                    <Text style={styles.subGreeting}>Move. Improve. Repeat.</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.iconCircle} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNotifs(true); }}>
               <Ionicons name="notifications-outline" size={22} color="#fff" />
               <View style={[styles.notifBadge, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* HEALTH CONNECT PERMISSION BANNER */}
        {needsPermission && (
          <Animated.View entering={FadeInDown} style={[styles.permissionBanner, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }]}>
            <View style={styles.permissionInfo}>
              <Ionicons name="fitness" size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionTitle}>Sync Your Steps</Text>
                <Text style={styles.permissionDesc}>Enable Health Connect to track your daily progress and hit your goals.</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.permissionBtn, { backgroundColor: colors.primary }]} onPress={requestAuthorization}>
              <Text style={styles.permissionBtnText}>Enable Now</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 1. STEP RING */}
        <View style={styles.ringContainer}>
          <ZenithAvatar mood={zenith?.mood} isAchieved={isZenithAchieved} steps={dailySteps} target={zenith?.target || stepGoal} forceTrigger={forceZenithTrigger} ringUiOpacity={ringUiOpacity} />
          <TouchableOpacity activeOpacity={1} onPress={handleRingPress}>
            <Animated.View style={[styles.svgWrapper, animatedPulseStyle]}>
                <Svg width={size} height={size}>
                <Defs>
                    <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={isZenithAchieved ? colors.secondary : colors.primary} stopOpacity="1" />
                    <Stop offset="1" stopColor={isZenithAchieved ? colors.accent : colors.accent} stopOpacity="1" />
                    </SvgGradient>
                </Defs>
                <Circle cx={size / 2} cy={size / 2} r={outerRadius} stroke="rgba(255,255,255,0.05)" strokeWidth={1} fill="none" />
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} fill="none" />
                <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={isZenithAchieved ? colors.secondary : colors.primary} animatedProps={animatedGlowProps} strokeLinecap="round" fill="none" rotation="-90" originX={size / 2} originY={size / 2} />
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#grad)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffsetValue} fill="none" rotation="-90" originX={size / 2} originY={size / 2} />
                {zenith && (
                    <Circle cx={size / 2} cy={size / 2} r={radius} stroke={isZenithAchieved ? "#4ade80" : "rgba(255,255,255,0.4)"} strokeWidth={strokeWidth + 4} strokeDasharray={`2, ${circumference}`} strokeDashoffset={zenithOffset} fill="none" rotation="-90" originX={size / 2} originY={size / 2} />
                )}
                </Svg>

                <Animated.View style={[styles.ringCenterText, animatedRingTextStyle]}>
                <Text style={styles.dailyStepGoalText}>{isZenithAchieved ? 'ZENITH ACHIEVED' : 'DAILY STEP GOAL'}</Text>
                <Text style={[styles.stepCount, isZenithAchieved && styles.zenithStepText]}>{dailySteps.toLocaleString()}</Text>
                <Text style={styles.stepsText}>OF {stepGoal.toLocaleString()} STEPS</Text>
                
                {loadingHistory ? (
                    <View style={{ marginTop: 15 }}><Skeleton width={120} height={32} borderRadius={20} /></View>
                ) : zenith && (
                    <View style={[styles.zenithStatusBadge, isZenithAchieved && styles.zenithActiveBadge, !isZenithAchieved && { borderColor: `${colors.primary}33` }]}>
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setForceZenithTrigger(Date.now())}>
                        <View style={styles.zenithAvatarWrapper}>
                            <MascotRenderer id={zenith?.mood} size={20} theme={isZenithAchieved ? 'solar' : (zenith?.mood === 'Surge' ? 'nebula' : 'solar')} />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowZenithInfo(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.zenithStatusText, { color: isZenithAchieved ? '#000' : colors.primary }]}>{isZenithAchieved ? 'PEAK' : `ZENITH: ${zenith.target.toLocaleString()}`}</Text>
                        <Ionicons name="information-circle-outline" size={14} color={isZenithAchieved ? "#000" : colors.primary} />
                      </TouchableOpacity>
                    </View>
                )}
                </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* METRICS */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricTile, { marginLeft: 0 }]}>
            <View style={styles.metricHeader}><Ionicons name="trail-sign-outline" size={12} color="#a0a0ab" /><Text style={styles.metricLabel}>DISTANCE</Text></View>
            <View style={styles.metricValRow}><Text style={styles.metricVal}>{displayDistance}</Text><Text style={styles.metricUnit}>km</Text></View>
          </View>
          <View style={styles.metricTile}>
            <View style={styles.metricHeader}><Ionicons name="flame-outline" size={12} color="#a0a0ab" /><Text style={styles.metricLabel}>CALORIES</Text></View>
            <View style={styles.metricValRow}><Text style={styles.metricVal}>{caloriesKcal.toLocaleString()}</Text><Text style={styles.metricUnit}>kcal</Text></View>
          </View>
          <View style={[styles.metricTile, { marginRight: 0 }]}>
            <View style={styles.metricHeader}><Ionicons name="flash-outline" size={12} color="#a0a0ab" /><Text style={styles.metricLabel}>ACTIVE</Text></View>
            <View style={styles.metricValRow}><Text style={styles.metricVal}>{Math.round(dailySteps * 0.009)}</Text><Text style={styles.metricUnit}>min</Text></View>
          </View>
        </View>

        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/history'); }} style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>View Step History</Text>
            <Ionicons name="arrow-forward" size={14} color="#a0a0ab" />
        </TouchableOpacity>

        {/* AI COACH MOCK */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/explore'); }}>
            <View style={styles.aiSpark}><Ionicons name="sparkles" size={14} color="#C8A8FF" /></View>
            <View style={{flex: 1}}>
                <View style={styles.aiBannerHeader}>
                    <Text style={styles.aiBannerTag}>AI Coach</Text>
                    <View style={styles.liveDot} />
                </View>
                <Text style={styles.aiBannerText}>
                    You're {(stepGoal - dailySteps > 0) ? (stepGoal - dailySteps).toLocaleString() : 0} steps short of your goal. <Text style={{color: '#FFB991'}}>A 15-min walk after dinner does it.</Text>
                </Text>
                <View style={styles.aiBannerFooter}>
                    <Text style={styles.aiBannerFooterText}>See full plan</Text>
                    <Ionicons name="arrow-forward" size={12} color="#a0a0ab" />
                </View>
                </View>
                </TouchableOpacity>

                {/* AI FORM COACH PRO PREVIEW */}
                <TouchableOpacity 
                style={[styles.aiBanner, { borderColor: '#4ade8033', marginTop: -20 }]} 
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFormCoach(true); }}
                >
                <View style={[styles.aiSpark, { backgroundColor: '#4ade801a' }]}><Ionicons name="body" size={14} color="#4ade80" /></View>
                <View style={{flex: 1}}>
                <View style={styles.aiBannerHeader}>
                    <Text style={[styles.aiBannerTag, { color: '#4ade80' }]}>Form Coach</Text>
                    <View style={styles.proBadgeMini}><Text style={styles.proBadgeMiniText}>PRO</Text></View>
                </View>
                <Text style={styles.aiBannerText}>
                    Analyze your running gait using Astra Vision. <Text style={{color: '#4ade80'}}>Prevent knee &amp; ankle injuries.</Text>
                </Text>
                </View>
                </TouchableOpacity>

                {/* RUNNER SYNC */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Runner Sync</Text></View>
        <LinearGradient colors={[`${colors.primary}26`, 'rgba(255, 255, 255, 0.02)']} style={[styles.stravaCardNew, { borderColor: `${colors.primary}4D` }]}>
            <View style={styles.stravaHeaderRowNew}>
                <View style={styles.stravaDot} />
                <Text style={styles.stravaLabelNew}>LAST ACTIVITY • STRAVA</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.stravaTimeNew}>2h ago</Text>
            </View>
            <View style={styles.stravaBodyNew}>
                <Text style={styles.stravaTitleNew}>Cubbon Park morning loop 🌅</Text>
                <Text style={styles.stravaSubtextNew}>Bengaluru • Easy run</Text>
                <View style={styles.stravaStatsGridNew}>
                    <View>
                        <Text style={styles.stravaMiniLabel}>DISTANCE</Text>
                        <View style={styles.stravaMiniValRow}><Text style={styles.stravaMiniVal}>5.2</Text><Text style={styles.stravaMiniUnit}>km</Text></View>
                    </View>
                    <View>
                        <Text style={styles.stravaMiniLabel}>PACE</Text>
                        <View style={styles.stravaMiniValRow}><Text style={styles.stravaMiniVal}>5'42"</Text><Text style={styles.stravaMiniUnit}>/km</Text></View>
                    </View>
                    <View>
                        <Text style={styles.stravaMiniLabel}>TIME</Text>
                        <View style={styles.stravaMiniValRow}><Text style={styles.stravaMiniVal}>29:48</Text></View>
                    </View>
                    <View>
                        <Text style={styles.stravaMiniLabel}>HEART</Text>
                        <View style={styles.stravaMiniValRow}><Text style={styles.stravaMiniVal}>142</Text><Text style={styles.stravaMiniUnit}>bpm</Text></View>
                    </View>
                </View>
                {/* Elevation Graph Mock */}
                <Svg height="50" width="100%" style={{ marginTop: 15 }} viewBox="0 0 300 50" preserveAspectRatio="none">
                    <Defs>
                        <SvgGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.4" />
                            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                        </SvgGradient>
                    </Defs>
                    <Path d="M0,40 L20,32 L40,28 L60,30 L90,18 L120,22 L150,12 L180,18 L210,8 L240,16 L270,24 L300,30 L300,50 L0,50 Z" fill="url(#elev)" />
                    <Path d="M0,40 L20,32 L40,28 L60,30 L90,18 L120,22 L150,12 L180,18 L210,8 L240,16 L270,24 L300,30" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
        </LinearGradient>

        {/* CHALLENGES */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>My Challenges</Text></View>
        {loadingChallenges ? (
          <Skeleton width="100%" height={120} borderRadius={28} />
        ) : activeChallenges.length > 0 ? activeChallenges.map((challenge, idx) => (
          <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => handleChallengePress(challenge)}>
            <LinearGradient 
                colors={challenge.status === 'suggestion' ? ['rgba(255, 122, 0, 0.12)', 'rgba(255, 122, 0, 0.02)'] : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']} 
                style={[styles.eventCard, challenge.status === 'suggestion' && { borderColor: 'rgba(255, 122, 0, 0.3)' }]}
            >
              <View style={styles.eventRowLine}>
                <View>
                    <Text style={styles.eventCardTitle}>{challenge.status === 'suggestion' ? '🎯' : '🎖'} {challenge.name}</Text>
                    {challenge.isRecommended && <View style={styles.recBadge}><Text style={styles.recBadgeText}>RECOMMENDED MISSION</Text></View>}
                </View>
                <Text style={[styles.eventPercent, { color: challenge.status === 'completed' ? '#4ade80' : (challenge.status === 'suggestion' ? '#ff7a00' : colors.primary) }]}>
                  {challenge.status === 'completed' ? 'DONE' : (challenge.status === 'suggestion' ? 'NEW' : `${challenge.progress || 0}%`)}
                </Text>
              </View>
              <View style={styles.progressBarBG}>
                  <LinearGradient 
                    colors={challenge.status === 'completed' ? ['#4ade80', '#22c55e'] : (challenge.status === 'suggestion' ? ['#ff7a00', '#ffb347'] : [colors.primary, colors.secondary])} 
                    style={[styles.progressBarFill, { width: `${challenge.progress || 0}%` }]} 
                    start={{x:0, y:0}} end={{x:1, y:1}} 
                  />
              </View>
              <Text style={styles.eventSubtext}>{challenge.status === 'completed' ? 'Challenge Conquered! Tap to view glory.' : challenge.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )) : (
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/events')}>
                <LinearGradient colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']} style={styles.emptyMissionCard}>
                    <Ionicons name="trophy-outline" size={32} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyMissionTitle}>No Active Missions</Text>
                    <Text style={styles.emptyMissionDesc}>You haven't joined any challenges yet. Start your first mission to earn digital BIBs and glory!</Text>
                    <View style={[styles.exploreBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.exploreBtnText}>Explore Missions</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            )}

            {/* AI STRIDE GUARD */}
            <StrideGuardStatus />

            {/* UPCOMING EVENTS */}
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Upcoming Events</Text></View>        {loadingEvents ? (
          <View style={{ flexDirection: 'row', gap: 15 }}><Skeleton width={width * 0.7} height={180} borderRadius={28} /><Skeleton width={width * 0.7} height={180} borderRadius={28} /></View>
        ) : upcomingEvents.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {upcomingEvents.map((evt, idx) => (
              <TouchableOpacity 
                key={idx} 
                activeOpacity={0.8} 
                onPress={() => { 
                    Haptics.selectionAsync(); 
                    router.push({ pathname: '/event-detail', params: { event: JSON.stringify(evt) } }); 
                }}
              >
                <LinearGradient colors={[evt.color || `${colors.primary}26`, 'rgba(255, 255, 255, 0.03)']} style={styles.upcomingCard}>
                  <Text style={[styles.upDate, { color: colors.primary }]}>
                    {evt.startDate ? new Date(evt.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : evt.date}
                  </Text>
                  <Text style={styles.upTitle} numberOfLines={1}>{evt.title}</Text>
                  <Text style={styles.upSubtitle} numberOfLines={1}>{evt.subtitle}</Text>
                  <View style={styles.joinBtn}><Text style={styles.joinBtnText}>View Details</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <View style={{ width: 20 }} />
          </ScrollView>
        )}

        {/* EXCLUSIVE OFFERS (Sponsor Banners + Ads) */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Exclusive Offers</Text></View>
        {loadingBanners ? (
          <View style={{ marginBottom: 35 }}><Skeleton width="100%" height={120} borderRadius={20} /></View>
        ) : banners.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {banners.map((banner, idx) => (
              <React.Fragment key={idx}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => { Haptics.selectionAsync(); }}>
                  <View style={styles.bannerCard}>
                    <Image source={{ uri: banner.imageUrl || 'https://via.placeholder.com/400x200?text=Sponsor' }} style={styles.bannerImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                {/* Interleave a Native Ad after the first Admin Banner */}
                {idx === 0 && <AdCard />}
                </React.Fragment>
            ))}
            <View style={{ width: 20 }} />
          </ScrollView>
        ) : <Text style={styles.emptyText}>No offers available right now.</Text>}

        {/* COMMUNITY HERO */}
        {loadingHero ? (
          <View style={{ marginTop: 20 }}><Skeleton width="100%" height={150} borderRadius={28} /></View>
        ) : communityHero && (
          <LinearGradient colors={['rgba(74, 222, 128, 0.08)', 'rgba(0,0,0,0)']} style={styles.heroBanner}>
            <View style={styles.heroHeader}><Ionicons name="heart" size={18} color="#4ade80" /><Text style={styles.heroBadge}>COMMUNITY SPOTLIGHT</Text></View>
            <View style={styles.heroContent}><Image source={{ uri: communityHero.avatar }} style={styles.heroAvatar} /><View style={styles.heroTextContent}><Text style={styles.heroName}>{communityHero.name}</Text><Text style={styles.heroAchievement}>{communityHero.achievement}</Text></View></View>
            <Text style={styles.heroMessage}>{communityHero.message}</Text>
          </LinearGradient>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ZENITH INFO POPUP */}
      <Modal visible={showZenithInfo} transparent animationType="fade">
        <View style={styles.zenithModalOverlay}>
          <Animated.View entering={FadeInDown} style={styles.zenithModalContent}>
            <LinearGradient colors={[colors.background[0], '#0f0f13']} style={styles.zenithModalGradient}>
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowZenithInfo(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              <MascotRenderer id={zenith?.mood} size={80} style={styles.zenithModalAvatar} theme={isZenithAchieved ? 'solar' : (zenith?.mood === 'Surge' ? 'nebula' : 'solar')} />
              <Text style={styles.zenithModalTitle}>ASTRA ZENITH AI</Text>
              <View style={[styles.moodBadge, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }]}><Text style={[styles.moodText, { color: colors.primary }]}>{zenith?.mood || 'Steady'} Mode</Text></View>
              <Text style={styles.zenithModalQuote}>"{zenith?.message}"</Text>
              <View style={styles.zenithModalDivider} />
              <View style={styles.zenithModalStats}>
                <View style={styles.zenithStatItem}><Text style={styles.zenithStatLabel}>YOUR 7-DAY AVG</Text><Text style={styles.zenithStatVal}>{Math.round(zenith?.target / 1.1).toLocaleString()}</Text></View>
                <View style={styles.zenithStatItem}><Text style={styles.zenithStatLabel}>ZENITH TARGET</Text><Text style={[styles.zenithStatVal, {color: colors.primary}]}>{zenith?.target.toLocaleString()}</Text></View>
              </View>
              <TouchableOpacity style={[styles.zenithModalBtn, { backgroundColor: colors.primary }]} onPress={() => setShowZenithInfo(false)}><Text style={styles.zenithModalBtnText}>Let's Crush it!</Text></TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      <NotificationModal visible={showNotifs} onClose={() => setShowNotifs(false)} />
      <FuelSyncModal visible={showFuelSync} onClose={() => setShowFuelSync(false)} lastActivity={lastActivity} userProfile={userProfile} />

      {showBIB && lastActivity && userProfile && (
        <DigitalBIB userName={`${userProfile.firstName} ${userProfile.lastName}`} activityName={lastActivity.name} distance={lastActivity.distance.toString()} type={lastActivity.type} tagline={lastActivity.heroTagline || "Unstoppable force."} date={lastActivity.startDate} onClose={() => setShowBIB(false)} />
      )}

      <AIFormCoachModule visible={showFormCoach} onClose={() => setShowFormCoach(false)} />

      {completedChallenge && userProfile && (
        <DigitalBIB 
          userName={`${userProfile.firstName} ${userProfile.lastName}`} 
          activityName={completedChallenge.name} 
          distance={completedChallenge.currentVal?.toLocaleString() || '100%'} 
          type={completedChallenge.type || 'CHALLENGE'} 
          tagline={completedChallenge.narrative || "The legend grows."} 
          date={completedChallenge.completedAt || new Date().toISOString()} 
          onClose={() => setCompletedChallenge(null)} 
          isAchievement={true}
          narrative={completedChallenge.narrative}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  auraGlow: { position: 'absolute', top: '30%', left: '-20%', width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 25 },
  header: { marginBottom: 40 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeading: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  greetingCol: { flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, overflow: 'hidden' },
  headerAvatar: { width: '100%', height: '100%' },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#1c1d2e' },
  brandTitle: { fontSize: 24, color: '#ffffff', fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { fontSize: 14, color: '#a0a0ab', marginTop: 2 },
  permissionBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 35, 
    borderWidth: 1 
  },
  permissionInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  permissionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  permissionDesc: { color: '#a0a0ab', fontSize: 12, marginTop: 4, lineHeight: 18 },
  permissionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginLeft: 10 },
  permissionBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
  ringContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  svgWrapper: { alignItems: 'center', justifyContent: 'center' },
  ringCenterText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  dailyStepGoalText: { color: '#a0a0ab', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 5 },
  stepCount: { fontSize: 64, fontWeight: '900', color: '#ffffff', letterSpacing: -2 },
  zenithStepText: { color: '#4ade80' },
  stepsText: { fontSize: 12, color: '#a0a0ab', fontWeight: '700', letterSpacing: 1, marginTop: 5 },
  historyLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  historyLinkText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  zenithStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginTop: 25, borderWidth: 1 },
  zenithActiveBadge: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  zenithStatusText: { fontSize: 11, fontWeight: '900' },
  zenithAvatarWrapper: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  twoCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  glassCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { fontSize: 10, color: '#666677', fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  cardValRow: { flexDirection: 'row', alignItems: 'baseline' },
  cardMaxVal: { fontSize: 24, color: '#fff', fontWeight: '800' },
  cardMinVal: { fontSize: 12, color: '#666677', marginLeft: 4 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  stravaCard: { width: '100%', padding: 24, borderRadius: 28, marginBottom: 35, borderWidth: 1 },
  stravaHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stravaIconBg: { padding: 10, borderRadius: 14, marginRight: 15 },
  stravaLogo: { width: 24, height: 24 },
  stravaTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  stravaSubtext: { color: '#666677', fontSize: 12, marginTop: 2 },
  stravaStatsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16 },
  recentRunText: { fontSize: 22, fontWeight: '900' },
  recentRunPace: { color: '#fff', fontSize: 14, fontWeight: '700', opacity: 0.8 },
  fuelSyncBox: { marginTop: 15, borderRadius: 12, padding: 12, borderWidth: 1 },
  fuelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fuelLabel: { fontSize: 9, fontWeight: '900' },
  fuelTip: { color: '#a0a0ab', fontSize: 12, lineHeight: 16 },
  stravaButton: { paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
  stravaButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  eventCard: { padding: 24, borderRadius: 28, marginBottom: 35, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  eventRowLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventCardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  eventPercent: { fontWeight: '900', fontSize: 20 },
  progressBarBG: { width: '100%', height: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, marginTop: 18, marginBottom: 14, overflow: 'hidden' },
  progressBarFill: { height: 12, borderRadius: 6 },
  eventSubtext: { color: '#8e8e9e', fontSize: 13, fontWeight: '600' },
  horizontalScroll: { marginBottom: 35, overflow: 'visible' },
  bannerCard: { width: width * 0.85, height: 160, borderRadius: 24, marginRight: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bannerImage: { width: '100%', height: '100%' },
  bannerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', padding: 20, justifyContent: 'flex-end' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSubtitle: { color: '#fff', opacity: 0.8, fontSize: 12, marginTop: 4 },
  upcomingCard: { width: width * 0.7, padding: 24, borderRadius: 28, marginRight: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  upDate: { fontSize: 13, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  upTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  upSubtitle: { color: '#8e8e9e', fontSize: 14, fontWeight: '600', marginBottom: 25 },
  joinBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  heroBanner: { padding: 22, borderRadius: 28, marginBottom: 35, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.15)' },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  heroBadge: { color: '#4ade80', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  heroAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#4ade80' },
  heroTextContent: { flex: 1 },
  heroName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  heroAchievement: { color: '#a0a0ab', fontSize: 12, fontWeight: '600' },
  heroMessage: { color: '#ffffff', fontSize: 14, lineHeight: 20, fontWeight: '500', opacity: 0.9 },
  emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 30 },
  emptyMissionCard: { padding: 30, borderRadius: 28, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 35 },
  emptyMissionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 15, marginBottom: 8 },
  emptyMissionDesc: { color: '#8e8e9e', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  exploreBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  exploreBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
  recBadge: { alignSelf: 'flex-start', backgroundColor: '#ff7a00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  recBadgeText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  proBadgeMini: { backgroundColor: '#4ade80', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 8 },
  proBadgeMiniText: { color: '#000', fontSize: 8, fontWeight: '900' },
  zenithModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  zenithModalContent: { width: '85%', borderRadius: 32, overflow: 'hidden' },
  zenithModalGradient: { padding: 35, alignItems: 'center' },
  moodBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  moodText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  closeModal: { position: 'absolute', top: 20, right: 25, zIndex: 10 },
  zenithModalAvatar: { width: 80, height: 80, marginBottom: 20 },
  zenithModalTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  zenithModalQuote: { color: '#fff', opacity: 0.8, fontSize: 13, fontWeight: '700', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  zenithModalDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 25 },
  zenithModalDesc: { color: '#a0a0ab', fontSize: 14, lineHeight: 22, textAlign: 'center', fontWeight: '500' },
  zenithModalStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 30 },
  zenithStatItem: { alignItems: 'center' },
  zenithStatLabel: { color: '#666677', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  zenithStatVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  zenithModalBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, marginTop: 40, alignItems: 'center' },
  zenithModalBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginHorizontal: 4 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metricLabel: { color: '#a0a0ab', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  metricValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  metricVal: { fontSize: 24, color: '#fff', fontWeight: '800' },
  metricUnit: { fontSize: 13, color: '#a0a0ab', fontWeight: '600' },
  historyBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 40 },
  historyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  aiBanner: { width: '100%', padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', gap: 12, marginBottom: 40 },
  aiSpark: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(200,168,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  aiBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aiBannerTag: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: '#C8A8FF' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8A8FF' },
  aiBannerText: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: '#fff' },
  aiBannerFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  aiBannerFooterText: { fontSize: 12, color: '#a0a0ab' },
  stravaCardNew: { borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 35 },
  stravaHeaderRowNew: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  stravaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FC4C02' },
  stravaLabelNew: { fontSize: 12, fontWeight: '600', color: '#a0a0ab', letterSpacing: 0.5 },
  stravaTimeNew: { fontSize: 11, color: '#666677' },
  stravaBodyNew: { padding: 16 },
  stravaTitleNew: { fontSize: 16, fontWeight: '600', color: '#fff' },
  stravaSubtextNew: { fontSize: 12, color: '#a0a0ab', marginTop: 3 },
  stravaStatsGridNew: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  stravaMiniLabel: { fontSize: 9, color: '#666677', fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  stravaMiniValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  stravaMiniVal: { fontSize: 16, color: '#fff', fontWeight: '800' },
  stravaMiniUnit: { fontSize: 10, color: '#666677' }
});
