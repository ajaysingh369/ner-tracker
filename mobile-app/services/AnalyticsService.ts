import analytics from '@react-native-firebase/analytics';

/**
 * RunAstra Analytics Service
 * Standardizes event logging across the app for funnel tracking.
 */
export const Analytics = {
  /**
   * Log when a user views a specific screen
   */
  logScreenView: async (screenName: string) => {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  },

  /**
   * Log user interaction (clicks, toggles, etc.)
   */
  logEvent: async (eventName: string, params: object = {}) => {
    await analytics().logEvent(eventName, params);
  },

  /**
   * Specifically track Pro conversion funnel points
   */
  logProInterest: async (featureName: string) => {
    await analytics().logEvent('pro_cta_click', {
      feature: featureName,
    });
  },

  /**
   * Track successful onboarding completion
   */
  logOnboardingComplete: async () => {
    await analytics().logEvent('onboarding_complete');
  },

  /**
   * Identify user for better cross-device tracking
   */
  setUser: async (userId: string, email: string) => {
    await Promise.all([
      analytics().setUserId(userId),
      analytics().setUserProperty('email', email),
    ]);
  }
};
