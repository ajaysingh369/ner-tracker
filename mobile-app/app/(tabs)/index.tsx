import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions, Alert, Modal, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
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
import Skeleton from '../../components/Skeleton';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// SVG Ring Settings
const size = width * 0.85; 
const strokeWidth = 24;
const radius = (size - (strokeWidth + 24)) / 2;
const outerRadius = radius + (strokeWidth / 2) + 6;
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

    const safeFetch = (url: string) => fetch(url, { headers }).then(r => r.ok ? r.json() : null).catch(() => null);

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
    safeFetch(`${API_URL}/user/challenges?userId=${athleteId}`).then(data => {
        if (data?.status === 'success') setActiveChallenges(data.challenges);
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
    const API_URL = "https://ner-tracker.vercel.app";
    router.push(`${API_URL}/auth/strava?state=runastra_${userProfile?.userId}`);
  };

  const handleChallengePress = (challenge: any) => {
    Haptics.selectionAsync();
    if (challenge.type === 'WEB_TRACKER' && challenge.url) {
      router.push({ pathname: '/webview', params: { url: challenge.url, title: challenge.name } });
    }
  };

  const displayDistance = dailyDistance > 0 ? dailyDistance.toFixed(1) : (dailySteps * 0.000762).toFixed(1);
  const caloriesKcal = Math.round(dailySteps * 0.04);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
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

            <View style={styles.ringCenterText}>
              <Text style={styles.dailyStepGoalText}>{isZenithAchieved ? 'ZENITH ACHIEVED' : 'DAILY STEP GOAL'}</Text>
              <Text style={[styles.stepCount, isZenithAchieved && styles.zenithStepText]}>{dailySteps.toLocaleString()}</Text>
              <Text style={styles.stepsText}>OF {stepGoal.toLocaleString()} STEPS</Text>
              {loadingHistory ? (
                <View style={{ marginTop: 25 }}><Skeleton width={120} height={32} borderRadius={20} /></View>
              ) : zenith && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowZenithInfo(true); }} style={[styles.zenithStatusBadge, isZenithAchieved && styles.zenithActiveBadge, !isZenithAchieved && { borderColor: `${colors.primary}33` }]}>
                  <View style={styles.zenithAvatarWrapper}><Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9440/9440938.png' }} style={styles.zenithAvatar} /></View>
                  <Text style={[styles.zenithStatusText, { color: isZenithAchieved ? '#000' : colors.primary }]}>{isZenithAchieved ? 'PEAK' : `ZENITH: ${zenith.target.toLocaleString()}`}</Text>
                  <Ionicons name="information-circle-outline" size={14} color={isZenithAchieved ? "#000" : colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {/* METRICS */}
        <View style={styles.twoCardsRow}>
          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>DISTANCE</Text>
            <View style={styles.cardValRow}><Text style={styles.cardMaxVal}>{displayDistance}</Text><Text style={styles.cardMinVal}> km</Text></View>
          </View>
          <View style={styles.glassCard}>
            <Text style={styles.cardHeader}>CALORIES</Text>
            <View style={styles.cardValRow}><Text style={styles.cardMaxVal}>{caloriesKcal.toLocaleString()}</Text><Text style={styles.cardMinVal}> kcal</Text></View>
          </View>
        </View>

        {/* RUNNER SYNC */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Runner Sync</Text></View>
        {loadingStrava ? (
          <Skeleton width="100%" height={180} borderRadius={28} />
        ) : (
          <LinearGradient colors={[`${colors.primary}26`, 'rgba(255, 255, 255, 0.02)']} style={[styles.stravaCard, { borderColor: `${colors.primary}4D` }]}>
            {isStravaConnected && lastActivity ? (
              <View>
                <TouchableOpacity activeOpacity={0.9} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowBIB(true); }}>
                  <View style={styles.stravaHeaderRow}>
                    <View style={[styles.stravaIconBg, { backgroundColor: `${colors.primary}1A` }]}><Image source={{ uri: 'https://d3nn82uaxijpm6.cloudfront.net/apple-touch-icon-144x144.png' }} style={styles.stravaLogo} /></View>
                    <View><Text style={styles.stravaTitle}>{lastActivity.name}</Text><Text style={styles.stravaSubtext}>Last Activity • Tap to Share</Text></View>
                  </View>
                  <View style={styles.stravaStatsRow}><Text style={[styles.recentRunText, { color: colors.primary }]}>{lastActivity.distance} km</Text><Text style={styles.recentRunPace}>{lastActivity.type}</Text></View>
                </TouchableOpacity>
                {lastActivity.fuelSync && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFuelSync(true); }}>
                    <View style={[styles.fuelSyncBox, { backgroundColor: `${colors.primary}0D`, borderColor: `${colors.primary}33` }]}>
                      <View style={styles.fuelHeader}><Ionicons name="sparkles" size={14} color={colors.primary} /><Text style={[styles.fuelLabel, { color: colors.primary }]}>AI FUEL-SYNC • {lastActivity.fuelSync.intensity} INTENSITY</Text><Ionicons name="chevron-forward" size={12} color={colors.primary} style={{marginLeft: 'auto'}} /></View>
                      <Text style={styles.fuelTip}>{lastActivity.fuelSync.tip}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={[styles.stravaButton, { backgroundColor: colors.primary }]} onPress={handleStravaConnect}><Text style={styles.stravaButtonText}>Connect Strava</Text></TouchableOpacity>
            )}
          </LinearGradient>
        )}

        {/* CHALLENGES */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>My Challenges</Text></View>
        {loadingChallenges ? (
          <Skeleton width="100%" height={120} borderRadius={28} />
        ) : activeChallenges.length > 0 ? activeChallenges.map((challenge, idx) => (
          <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => handleChallengePress(challenge)}>
            <LinearGradient colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']} style={styles.eventCard}>
              <View style={styles.eventRowLine}><Text style={styles.eventCardTitle}>🎖 {challenge.name}</Text><Text style={[styles.eventPercent, { color: colors.primary }]}>{challenge.progress || 0}%</Text></View>
              <View style={styles.progressBarBG}><LinearGradient colors={[colors.primary, colors.secondary]} style={[styles.progressBarFill, { width: `${challenge.progress || 0}%` }]} start={{x:0, y:0}} end={{x:1, y:1}} /></View>
              <Text style={styles.eventSubtext}>{challenge.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )) : <Text style={styles.emptyText}>No active challenges.</Text>}

        {/* SPONSOR BANNERS */}
        {loadingBanners ? (
          <View style={{ marginBottom: 35 }}><Skeleton width="100%" height={120} borderRadius={20} /></View>
        ) : banners.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {banners.map((banner, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => { Haptics.selectionAsync(); }}>
                <View style={styles.bannerCard}>
                  <Image source={{ uri: banner.imageUrl || 'https://via.placeholder.com/400x200?text=Sponsor' }} style={styles.bannerImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ width: 20 }} />
          </ScrollView>
        )}

        {/* UPCOMING EVENTS */}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Upcoming</Text></View>
        {loadingEvents ? (
          <View style={{ flexDirection: 'row', gap: 15 }}><Skeleton width={width * 0.7} height={180} borderRadius={28} /><Skeleton width={width * 0.7} height={180} borderRadius={28} /></View>
        ) : upcomingEvents.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {upcomingEvents.map((evt, idx) => (
              <TouchableOpacity key={idx} activeOpacity={0.8} onPress={() => { Haptics.selectionAsync(); router.push('/events'); }}>
                <LinearGradient colors={[evt.color || `${colors.primary}26`, 'rgba(255, 255, 255, 0.03)']} style={styles.upcomingCard}>
                  <Text style={[styles.upDate, { color: colors.primary }]}>{evt.date}</Text><Text style={styles.upTitle}>{evt.title}</Text><Text style={styles.upSubtitle}>{evt.subtitle}</Text>
                  <View style={styles.joinBtn}><Text style={styles.joinBtnText}>Join Community</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            <View style={{ width: 20 }} />
          </ScrollView>
        )}

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
          <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.zenithModalContent}>
            <LinearGradient colors={[colors.background[0], '#0f0f13']} style={styles.zenithModalGradient}>
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowZenithInfo(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9440/9440938.png' }} style={styles.zenithModalAvatar} />
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
  zenithStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginTop: 25, borderWidth: 1 },
  zenithActiveBadge: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  zenithStatusText: { fontSize: 11, fontWeight: '900' },
  zenithAvatarWrapper: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  zenithAvatar: { width: '100%', height: '100%' },
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
  zenithModalBtnText: { color: '#000', fontWeight: '900', fontSize: 16 }
});
xt: { color: '#000', fontWeight: '900', fontSize: 16 }
});
