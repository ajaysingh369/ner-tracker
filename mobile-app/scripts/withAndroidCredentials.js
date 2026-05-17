const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidCredentials(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'RUNASTRA_RELEASE_STORE_FILE',
      value: '../../runastra-release.keystore',
    });
    config.modResults.push({
      type: 'property',
      key: 'RUNASTRA_RELEASE_KEY_ALIAS',
      value: 'runastra',
    });
    config.modResults.push({
      type: 'property',
      key: 'RUNASTRA_RELEASE_STORE_PASSWORD',
      value: 'runastra123',
    });
    config.modResults.push({
      type: 'property',
      key: 'RUNASTRA_RELEASE_KEY_PASSWORD',
      value: 'runastra123',
    });
    return config;
  });
};
