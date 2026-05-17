const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMicrophonePermission(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults.manifest;
    
    if (!androidManifest['uses-permission']) {
        androidManifest['uses-permission'] = [];
    }
    
    const permissions = [
        'android.permission.RECORD_AUDIO',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.FOREGROUND_SERVICE_LOCATION'
    ];

    permissions.forEach(perm => {
        const hasPermission = androidManifest['uses-permission'].some(
            p => p['$']['android:name'] === perm
        );
        if (!hasPermission) {
            androidManifest['uses-permission'].push({
                $: { 'android:name': perm }
            });
            console.log(`✅ Added ${perm} to AndroidManifest.xml`);
        }
    });

    // ── Update Foreground Service Type ───────────────────────────────────
    // expo-location uses a specific service. We need to ensure it has the 'microphone' type.
    const application = androidManifest.application[0];
    if (application && application.service) {
        const locationService = application.service.find(
            s => s['$']['android:name'] === 'expo.modules.location.services.LocationUpdaterService'
        );
        
        if (locationService) {
            // Merge types: location | microphone
            const currentType = locationService['$']['android:foregroundServiceType'] || '';
            if (!currentType.includes('microphone')) {
                const newType = currentType ? `${currentType}|microphone` : 'location|microphone';
                locationService['$']['android:foregroundServiceType'] = newType;
                console.log(`✅ Updated LocationUpdaterService to include foregroundServiceType: ${newType}`);
            }
        }
    }

    return config;
  });
};
