const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // 1. Inject the release signing config
      const releaseSigning = `
        release {
            if (project.hasProperty('RUNASTRA_RELEASE_STORE_FILE')) {
                storeFile file(RUNASTRA_RELEASE_STORE_FILE)
                storePassword RUNASTRA_RELEASE_STORE_PASSWORD
                keyAlias RUNASTRA_RELEASE_KEY_ALIAS
                keyPassword RUNASTRA_RELEASE_KEY_PASSWORD
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

      if (!contents.includes('RUNASTRA_RELEASE_STORE_FILE')) {
        console.log('✅ Injecting RunAstra Release Signing Config...');
        // Match the entire signingConfigs block and inject 'release' after the 'debug' block but before the final brace
        contents = contents.replace(/(signingConfigs\s*{[\s\S]*?debug\s*{[\s\S]*?}\s*)(})/, `$1${releaseSigning}\n    $2`);
      }

      // 2. Force release buildType to use release signingConfig
      if (contents.includes('signingConfig signingConfigs.debug')) {
         console.log('✅ Forcing Release BuildType to use Release Signing...');
         // Use a more specific match to only target the release build type block
         contents = contents.replace(/(buildTypes\s*{[\s\S]*?release\s*{[\s\S]*?signingConfig\s*)signingConfigs.debug/, `$1signingConfigs.release`);
      }

      config.modResults.contents = contents;
    }
    return config;
  });
};
