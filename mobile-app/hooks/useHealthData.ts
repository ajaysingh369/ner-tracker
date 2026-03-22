import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
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
      if (
        typeof (module as any).getSdkStatus === 'function' &&
        typeof (module as any).initialize === 'function' &&
        typeof (module as any).readRecords === 'function'
      ) {
        HealthConnect = module as unknown as HealthConnectAPI;
        console.log('✅ react-native-health-connect loaded');
      } else {
        console.warn('⚠️ react-native-health-connect missing exports');
      }
    } catch (e) {
      console.warn('⚠️ react-native-health-connect failed:', e);
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHealthData() {
  const [dailySteps, setDailySteps] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // needsPermission = true means we opened HC settings, waiting for user to return
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);
  const initDone = useRef(false);

  // ── Android step fetch ─────────────────────────────────────────────────
  const fetchAndroidSteps = useCallback(async () => {
    if (!HealthConnect) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await HealthConnect.aggregateRecord({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: tomorrow.toISOString(),
        },
      });

      const total = result.COUNT_TOTAL ?? 0;
      console.log(`📊 Aggregated Steps: ${total}`);
      setDailySteps(total);
      
      // Attempt background sync of history
      syncAndroidStepsHistory();
    } catch (e: any) {
      console.error('Error fetching steps:', e);
    }
  }, []);

  // ── Background Sync Step History ─────────────────────────────────────────
  const syncAndroidStepsHistory = useCallback(async () => {
    try {
      if (!isAuthorized || !HealthConnect) return;

      const today = new Date();
      // Ensure we hit exactly the end of the day locally before sending
      today.setHours(23, 59, 59, 999);
      
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7); // Last 7 days
      lastWeek.setHours(0, 0, 0, 0);

      // We MUST use aggregateGroupByDuration, because the RN bridge has a bug parsing LocalDateTime strings. 
      // aggregateGroupByDuration natively accepts java.time.Instant which is default JS behavior.
      const result = await HealthConnect.aggregateGroupByDuration({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: lastWeek.toISOString(),
          endTime: today.toISOString(),
        },
        timeRangeSlicer: {
          duration: 'DAYS',
          length: 1
        }
      });

      // Remap the Android output syntax to our structured input syntax
      const records = result.map((group: any) => ({
        date: group.startTime.split('T')[0], // Extract YYYY-MM-DD reliably
        steps: group.result.COUNT_TOTAL || 0,
        source: 'health_connect'
      }));

      // Securely fetch dynamic Auth Context ID
      const athleteId = await AsyncStorage.getItem('athleteId');
      if (!athleteId) {
        console.warn('Sync aborted: User not authenticated.');
        return;
      }
      // Fallback API URL since prod Vercel domain isn't strictly set yet. Using Local laptop IP.
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.8:3003"; 
      
      await fetch(`${API_URL}/api/mobile/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ athleteId, records })
      });
      console.log('✅ Background sync complete for 7 days history.');
    } catch (e) {
      // Fail silently for background sync
      console.log('Sync to backend failed or unavailable:', e);
    }
  }, []);

  // ── Check if steps permission is currently granted ─────────────────────
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!HealthConnect) return false;
    try {
      const granted = await HealthConnect.getGrantedPermissions();
      const hasSteps = granted.some(
        (p: any) => p.recordType === 'Steps' && p.accessType === 'read',
      );
      console.log('Steps granted:', hasSteps, JSON.stringify(granted));
      return hasSteps;
    } catch (e) {
      console.warn('getGrantedPermissions failed:', e);
      return false;
    }
  }, []);

  // ── iOS ────────────────────────────────────────────────────────────────
  const fetchIOSSteps = useCallback(() => {
    if (!AppleHealthKit) return;
    const options = { date: new Date().toISOString() };
    AppleHealthKit.getStepCount(options, (err: any, results: any) => {
      if (err) { console.error('iOS steps error:', err); return; }
      setDailySteps(results.value || 0);
    });
  }, []);

  // ── Open Health Connect settings as last-resort fallback ───────────────
  const openHealthConnectForPermission = useCallback(() => {
    if (HealthConnect && typeof HealthConnect.openHealthConnectSettings === 'function') {
      console.log('📱 Opening Health Connect settings (fallback)...');
      HealthConnect.openHealthConnectSettings();
    }
  }, []);

  // ── Main authorization flow ────────────────────────────────────────────
  const requestAuthorization = useCallback(async () => {
    if (initDone.current) return; // prevent re-entry
    initDone.current = true;

    try {
      // ── iOS ──────────────────────────────────────────────────────────
      if (Platform.OS === 'ios') {
        await loadAppleHealthKit();
        if (!AppleHealthKit) { setError('Apple HealthKit not available.'); return; }
        const permissions = {
          permissions: {
            read: [AppleHealthKit.Constants.Permissions.StepCount],
            write: [],
          },
        };
        AppleHealthKit.initHealthKit(permissions, (err: any) => {
          if (err) { setError('Failed to initialize Apple HealthKit'); return; }
          setIsAuthorized(true);
          fetchIOSSteps();
        });
        return;
      }

      if (Platform.OS !== 'android') return;

      // ── Android ──────────────────────────────────────────────────────
      await loadHealthConnect();
      if (!HealthConnect) {
        setError('Health Connect not available on this device.');
        return;
      }

      // 1. Check SDK
      let sdkStatus = SDK_AVAILABLE;
      try {
        sdkStatus = await HealthConnect.getSdkStatus();
        console.log('SDK status:', sdkStatus);
      } catch { /* proceed */ }

      if (sdkStatus !== SDK_AVAILABLE) {
        setError('Please install "Health Connect" from the Play Store.');
        return;
      }

      // 2. Initialize
      console.log('🔑 Initializing Health Connect...');
      const initialized = await HealthConnect.initialize();
      console.log('Health Connect initialized:', initialized);
      if (!initialized) {
        setError('Health Connect could not be initialized.');
        return;
      }

      // 3. Check if already granted
      const alreadyGranted = await checkPermissions();
      if (alreadyGranted) {
        setIsAuthorized(true);
        fetchAndroidSteps();
        return;
      }

      // 4. Try requestPermission — this is the proper system dialog.
      //    It previously crashed due to a route bug (now fixed).
      //    If it still crashes/rejects, we fall back to openHealthConnectSettings.
      console.log('🔑 Requesting permission via dialog...');
      try {
        const granted = await HealthConnect.requestPermission([
          { recordType: 'Steps', accessType: 'read' },
        ]);
        console.log('requestPermission result:', JSON.stringify(granted));

        if (granted && granted.length > 0) {
          setIsAuthorized(true);
          setNeedsPermission(false);
          fetchAndroidSteps();
        } else {
          // Dialog shown but user denied — open settings as fallback guidance
          console.warn('Permission denied in dialog, opening HC settings...');
          setNeedsPermission(true);
          openHealthConnectForPermission();
        }
      } catch (permErr: any) {
        // requestPermission threw — fall back to settings page
        console.warn('requestPermission threw, falling back to settings:', permErr?.message);
        setNeedsPermission(true);
        openHealthConnectForPermission();
      }
    } catch (e: any) {
      console.error('❌ requestAuthorization error:', e);
      setError(e.message || 'Unknown health auth error');
      initDone.current = false; // allow retry on error
    }
  }, [checkPermissions, fetchAndroidSteps, fetchIOSSteps, openHealthConnectForPermission]);

  // ── On mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      setDailySteps(4821);
      setIsAuthorized(true);
      return;
    }
    // Small delay so Activity is fully attached
    const timer = setTimeout(requestAuthorization, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ── When app comes back from background: recheck permissions ──────────
  // Only active when needsPermission=true (user went to HC settings)
  useEffect(() => {
    if (Platform.OS !== 'android' || !needsPermission) return;

    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        console.log('▶️ App foregrounded — rechecking permissions...');
        const has = await checkPermissions();
        if (has) {
          setNeedsPermission(false);
          setIsAuthorized(true);
          fetchAndroidSteps();
        } else {
          // Don't re-open settings automatically — let the banner button handle it
          console.log('Still no permission after foreground.');
        }
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, [needsPermission, checkPermissions, fetchAndroidSteps]);

  // ── Poll steps every 30 s once authorized ─────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android' || !isAuthorized) return;
    fetchAndroidSteps(); // immediate fetch
    const timer = setInterval(fetchAndroidSteps, 30_000);
    return () => clearInterval(timer);
  }, [isAuthorized, fetchAndroidSteps]);

  return {
    dailySteps,
    isAuthorized,
    needsPermission,
    error,
    requestAuthorization,
    openHealthConnectForPermission,
  };
}
