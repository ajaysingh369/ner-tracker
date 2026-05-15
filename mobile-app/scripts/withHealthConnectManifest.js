const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withHealthConnectManifest(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults.manifest;
    
    // 1. Add <uses-feature> for Health Connect
    if (!androidManifest['uses-feature']) {
        androidManifest['uses-feature'] = [];
    }
    const hasFeature = androidManifest['uses-feature'].some(f => f['$']['android:name'] === 'android.hardware.health.connect');
    if (!hasFeature) {
        androidManifest['uses-feature'].push({
            $: {
                'android:name': 'android.hardware.health.connect',
                'android:required': 'false'
            }
        });
    }

    const application = androidManifest.application[0];
    const mainActivity = application.activity.find(
      a => a['$']['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      // 2. Clean up ALL rationale/health intent filters to avoid mangled ones
      mainActivity['intent-filter'] = (mainActivity['intent-filter'] || []).filter(filter => {
        const action = filter.action && filter.action[0]['$']['android:name'];
        if (!action) return true;
        return !(
            action.includes('ACTION_SHOW_PERMISSIONS_RATIONALE') ||
            action.includes('VIEW_PERMISSION_USAGE')
        );
      });

      // 3. Add the correct Rationale Intent Filter
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
        category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }]
      });

      // 4. Add the VIEW_PERMISSION_USAGE Intent Filter
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
        category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }]
      });

      // 5. Ensure metadata for rationale is present (Optional but recommended)
      if (!application['meta-data']) {
          application['meta-data'] = [];
      }
      const hasRationaleMeta = application['meta-data'].some(m => m['$']['android:name'] === 'health_permissions_rationale');
      if (!hasRationaleMeta) {
          application['meta-data'].push({
              $: {
                  'android:name': 'health_permissions_rationale',
                  'android:value': 'RunAstra uses steps and distance data to calculate your fitness progress and Zenith achievements.'
              }
          });
      }
      
      console.log('✅ Health Connect manifest optimized for Android 16 visibility.');
    }

    return config;
  });
};
