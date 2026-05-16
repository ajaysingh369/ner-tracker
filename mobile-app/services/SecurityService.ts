import DeviceInfo from 'react-native-device-info';
import { Platform, Alert, BackHandler } from 'react-native';

/**
 * World-Class Security Service for RunAstra.
 * Handles Root detection, Emulator detection, and Integrity checks.
 * Only executes in production mode to avoid hindering development.
 */
export const SecurityService = {
  async performSecurityCheck(): Promise<boolean> {
    // Strictly skip all security blocks in development mode
    if (__DEV__) {
      console.log('🛡️ [Security] Development mode detected. Skipping security hardening checks.');
      return true;
    }

    try {
      console.log('🛡️ [Security] Running production security audit...');

      // 1. Root & Jailbreak Detection
      const isRooted = await DeviceInfo.isRooted();
      if (isRooted) {
        this.handleSecurityFailure(
          'Security Alert',
          'RunAstra has detected that this device is rooted or jailbroken. For your protection and data integrity, the app cannot run in this environment.'
        );
        return false;
      }

      // 2. Emulator Detection
      // We block emulators in production to prevent automated scraping or botting
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        this.handleSecurityFailure(
          'Environment Alert',
          'RunAstra must be installed on a physical mobile device.'
        );
        return false;
      }

      // 3. Simple Integrity Check (Installer Verification)
      const installer = await DeviceInfo.getInstallerPackageName();
      const trustedInstallers = ['com.android.vending', 'com.apple.AppStore'];
      
      // If the installer is unknown (e.g. adb, side-load), we log it but don't necessarily kill the app
      // unless strict policy is requested. For now, we just ensure it's not a known malicious environment.
      if (installer && !trustedInstallers.includes(installer)) {
        console.warn(`🛡️ [Security] App installed via untrusted source: ${installer}`);
      }

      console.log('🛡️ [Security] Production security audit passed.');
      return true;
    } catch (e) {
      // In case of error during check, we allow the app to run to avoid locking out users
      // due to library failures, but we log the incident.
      console.error('🛡️ [Security] Audit failed with error:', e);
      return true;
    }
  },

  handleSecurityFailure(title: string, message: string) {
    Alert.alert(
      title,
      message,
      [{ 
        text: 'Exit App', 
        onPress: () => {
          if (Platform.OS === 'android') {
            BackHandler.exitApp();
          }
        } 
      }],
      { cancelable: false }
    );
  }
};
