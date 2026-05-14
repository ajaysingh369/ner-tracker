import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────
type HealthConnectAPI = {
  getSdkStatus: (pkg?: string) => Promise<number>;
  initialize: (pkg?: string) => Promise<boolean>;
  requestPermission: (perms: any[]) => Promise<any[]>;
  getGrantedPermissions: () => Promise<any[]>;
  openHealthConnectSettings: () => void;
  readRecords: (type: string, opts: any) => Promise<{ records: any[]; pageToken?: string }>;
  aggregateRecord: (params: any) => Promise<any>;
  aggregateGroupByDuration: (params: any) => Promise<any>;
};

let AppleHealthKit: any = null;
let HealthConnect: HealthConnectAPI | null = null;

// SDK Status Constants
const SDK_NOT_INSTALLED = 1;
const SDK_INSTALLED = 2;
const SDK_AVAILABLE = 3;

// ─── Lazy loaders ─────────────────────────────────────────────────────────────
async function loadAppleHealthKit() {
  if (!AppleHealthKit) {
    try {
      const module = await import('react-native-health');
      AppleHealthKit = module.default;
    } catch (e) {
      console.warn('⚠️ Apple HealthKit failed to load:', e);
    }
  }
}

async function loadHealthConnect() {
  if (!HealthConnect) {
    try {
      const module = await import('react-native-health-connect');
      const api = module as any;
      
      if (
        typeof api.getSdkStatus === 'function' &&
        typeof api.initialize === 'function' &&
        typeof api.requestPermission === 'function'
      ) {
        HealthConnect = api as HealthConnectAPI;
        console.log('✅ react-native-health-connect loaded & verified');
      } else {
        console.warn('⚠️ react-native-health-connect missing critical functions');
      }
    } catch (e) {
      console.warn('⚠️ react-native-health-connect failed:', e);
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHealthData() {
  const [dailySteps, setDailySteps] = useState<number>(0);
  const [dailyDistance, setDailyDistance] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);
  const initAttempted = useRef(false);

  // ── Background Sync Step History ─────────────────────────────────────────
  const syncAndroidStepsHistory = useCallback(async () => {
    try {
      if (!isAuthorized || !HealthConnect) return;

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const [stepResult, distanceResult] = await Promise.all([
        HealthConnect.aggregateGroupByDuration({
          recordType: 'Steps',
          timeRangeFilter: {
            operator: 'between',
            startTime: lastWeek.toISOString(),
            endTime: today.toISOString(),
          },
          timeRangeSlicer: { duration: 'DAYS', length: 1 }
        }),
        HealthConnect.aggregateGroupByDuration({
          recordType: 'Distance',
          timeRangeFilter: {
            operator: 'between',
            startTime: lastWeek.toISOString(),
            endTime: today.toISOString(),
          },
          timeRangeSlicer: { duration: 'DAYS', length: 1 }
        })
      ]).catch(() => [[], []]);

      if (!Array.isArray(stepResult)) return;

      const records = stepResult.map((group: any, index: number) => {
        const date = group.startTime?.split('T')[0] || new Date().toISOString().split('T')[0];
        const steps = group.result?.count || group.result?.COUNT_TOTAL || 0;
        
        let distanceKm = 0;
        if (Array.isArray(distanceResult) && distanceResult[index]) {
          const distMeters = distanceResult[index].result?.distance?.inMeters || 
                             distanceResult[index].result?.DISTANCE_TOTAL?.inMeters || 0;
          distanceKm = distMeters / 1000;
        }
        
        if (distanceKm === 0 && steps > 0) {
          distanceKm = steps * 0.000762; 
        }

        return { date, steps, distanceKm: parseFloat(distanceKm.toFixed(3)), source: 'health_connect' };
      });

      const athleteId = await AsyncStorage.getItem('athleteId');
      const token = await AsyncStorage.getItem('authToken');
      if (!athleteId) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL; 
      await fetch(`${API_URL}/mobile/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ athleteId, records })
      }).catch(() => null);

    } catch (e) { console.log('Sync Error:', e); }
  }, [isAuthorized]);

  // ── Android step fetch ─────────────────────────────────────────────────
  const fetchAndroidSteps = useCallback(async () => {
    if (!HealthConnect) return;
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await HealthConnect.aggregateGroupByDuration({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: endOfDay.toISOString(),
        },
        timeRangeSlicer: { duration: 'DAYS', length: 1 }
      });

      console.log('📊 Aggregate Result:', JSON.stringify(result));

      let total = 0;
      if (Array.isArray(result)) {
        total = result.reduce((acc: number, group: any) => {
          // Fallback for different SDK response formats
          const val = group.result?.count || 
                      group.result?.COUNT_TOTAL || 
                      group.result?.steps?.count || 
                      group.result?.steps || 0;
          return acc + val;
        }, 0);
      }
      
      console.log('👣 Calculated Total Steps:', total);
      setDailySteps(total);
      setDailyDistance(total * 0.000762);
      
      // Always attempt sync of history to catch missed days
      syncAndroidStepsHistory();
    } catch (e: any) { 
        console.log('Fetch Error:', e);
        // Fallback: Try reading records directly if aggregation fails
        try {
            const { records } = await HealthConnect!.readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startOfDay.toISOString(),
                    endTime: endOfDay.toISOString(),
                }
            });
            const directTotal = records.reduce((acc, curr) => acc + (curr.count || curr.steps || 0), 0);
            if (directTotal > 0) {
                setDailySteps(directTotal);
                setDailyDistance(directTotal * 0.000762);
            }
        } catch (innerE) {
            console.log('Fallback Fetch Error:', innerE);
        }
    }
  }, [syncAndroidStepsHistory]);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!HealthConnect) return false;
    try {
      const granted = await HealthConnect.getGrantedPermissions();
      return granted.some((p: any) => p.recordType === 'Steps' && p.accessType === 'read');
    } catch (e) { return false; }
  }, []);

  const openHealthConnectForPermission = useCallback(() => {
    if (HealthConnect && typeof HealthConnect.openHealthConnectSettings === 'function') {
      HealthConnect.openHealthConnectSettings();
    } else {
        Linking.openURL("market://details?id=com.google.android.apps.healthdata");
    }
  }, []);

  const requestAuthorization = useCallback(async () => {
    try {
      console.log('🔄 Requesting Health Authorization...');

      if (Platform.OS === 'ios') {
        await loadAppleHealthKit();
        if (!AppleHealthKit) return;
        const permissions = {
          permissions: {
            read: [AppleHealthKit.Constants.Permissions.StepCount, AppleHealthKit.Constants.Permissions.DistanceWalkingRunning],
            write: [],
          },
        };
        AppleHealthKit.initHealthKit(permissions, (err: any) => {
          if (!err) { setIsAuthorized(true); fetchIOSSteps(); }
        });
        return;
      }

      if (Platform.OS !== 'android') return;

      await loadHealthConnect();
      if (!HealthConnect) { 
        Alert.alert("Debug", "Health Connect module NOT found."); 
        return; 
      }

      const sdkStatus = await HealthConnect.getSdkStatus();
      console.log('📊 SDK Status:', sdkStatus);

      if (sdkStatus === SDK_NOT_INSTALLED) {
        Alert.alert("Install Required", "Please install Health Connect to track steps.", [
            { text: "Install", onPress: () => Linking.openURL("market://details?id=com.google.android.apps.healthdata") }
        ]);
        return;
      }

      const initialized = await HealthConnect.initialize();
      if (!initialized) { 
        Alert.alert("Debug", "Health Connect init failed."); 
        return; 
      }

      const alreadyGranted = await checkPermissions();
      if (alreadyGranted) {
        console.log('✅ Permissions already granted.');
        setIsAuthorized(true);
        setNeedsPermission(false);
        fetchAndroidSteps();
        return;
      }

      // Explicit Permission Dialog
      console.log('🔑 Triggering native permission dialog...');
      const granted = await HealthConnect.requestPermission([
        { recordType: 'Steps', accessType: 'read' },
        { recordType: 'Distance', accessType: 'read' }
      ]);

      console.log('✅ Granted array:', JSON.stringify(granted));

      if (granted && granted.length > 0) {
        setIsAuthorized(true);
        setNeedsPermission(false);
        fetchAndroidSteps();
      } else {
        setNeedsPermission(true);
        Alert.alert("Permission Required", "RunAstra needs step access to work correctly. Please enable 'Steps' and 'Distance' in the next screen.", [
            { text: "Open Settings", onPress: openHealthConnectForPermission }
        ]);
      }
    } catch (e: any) { 
        console.log('Auth Error:', e);
        Alert.alert("Auth Error", e.message || "Failed to request health permissions.");
    }
  }, [checkPermissions, fetchAndroidSteps, openHealthConnectForPermission]);

  const fetchIOSSteps = useCallback(() => {
    if (!AppleHealthKit) return;
    const options = { date: new Date().toISOString() };
    AppleHealthKit.getStepCount(options, (err: any, results: any) => {
      if (!err) { setDailySteps(results.value || 0); setDailyDistance((results.value || 0) * 0.000762); }
    });
  }, []);

  // ── Auto-Initialize on Mount ──────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') { setDailySteps(4821); setIsAuthorized(true); return; }

    const autoCheck = async () => {
        if (initAttempted.current) return;
        initAttempted.current = true;

        if (Platform.OS === 'android') {
            await loadHealthConnect();
            if (HealthConnect) {
                try {
                  await HealthConnect.initialize();
                } catch (e) {
                  console.log("Auto Check Init Error:", e);
                }
                const has = await checkPermissions();
                if (has) { 
                    setIsAuthorized(true); 
                    setNeedsPermission(false);
                    fetchAndroidSteps(); 
                } else {
                    setNeedsPermission(true);
                }
            }
        }
    };
    autoCheck();
  }, [checkPermissions, fetchAndroidSteps]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const has = await checkPermissions();
        if (has) { setNeedsPermission(false); setIsAuthorized(true); fetchAndroidSteps(); }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [checkPermissions, fetchAndroidSteps]);

  useEffect(() => {
    if (!isAuthorized) return;
    const triggerFetch = Platform.OS === 'android' ? fetchAndroidSteps : fetchIOSSteps;
    triggerFetch();
    const timer = setInterval(triggerFetch, 30_000);
    return () => clearInterval(timer);
  }, [isAuthorized, fetchAndroidSteps, fetchIOSSteps]);

  return {
    dailySteps,
    dailyDistance,
    isAuthorized,
    needsPermission,
    error,
    requestAuthorization,
    openHealthConnectForPermission,
  };
}
