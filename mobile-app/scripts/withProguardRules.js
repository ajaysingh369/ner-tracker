const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const proguardPath = path.join(projectRoot, 'android', 'app', 'proguard-rules.pro');
      
      let contents = '';
      if (fs.existsSync(proguardPath)) {
        contents = fs.readFileSync(proguardPath, 'utf8');
      }

      const rules = `
# Expo modules exceptions for R8/ProGuard
-dontwarn expo.modules.kotlin.runtime.MainRuntime
-dontwarn expo.modules.kotlin.services.FilePermissionService$Permission
-dontwarn expo.modules.kotlin.services.FilePermissionService
`;

      if (!contents.includes('expo.modules.kotlin.runtime.MainRuntime')) {
        fs.writeFileSync(proguardPath, contents + '\n' + rules);
      }
      
      return config;
    },
  ]);
};
