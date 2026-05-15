const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMicrophonePermission(config) {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults.manifest;
    
    if (!androidManifest['uses-permission']) {
        androidManifest['uses-permission'] = [];
    }
    
    const hasMicPermission = androidManifest['uses-permission'].some(
        p => p['$']['android:name'] === 'android.permission.RECORD_AUDIO'
    );
    
    if (!hasMicPermission) {
        androidManifest['uses-permission'].push({
            $: { 'android:name': 'android.permission.RECORD_AUDIO' }
        });
        console.log('✅ Added android.permission.RECORD_AUDIO to AndroidManifest.xml');
    }

    return config;
  });
};
