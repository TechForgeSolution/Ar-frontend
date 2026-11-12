const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIREBASE_TARGETS = [
  'RNFBApp', 'RNFBAuth', 'RNFBStorage', 'RNFBFirestore',
  'RNFBDatabase', 'RNFBMessaging', 'RNFBCrashlytics',
  'RNFBAnalytics', 'RNFBFunctions', 'RNFBRemoteConfig',
];

const INJECT_BLOCK = `
  # Fix non-modular headers for Xcode 16+ (explicit modules)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end

  # Disable module definition for Firebase RN pods (fixes Xcode 26)
  firebase_targets = ${JSON.stringify(FIREBASE_TARGETS)}
  installer.pods_project.targets.each do |target|
    if firebase_targets.include?(target.name)
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'NO'
        config.build_settings['CLANG_ENABLE_EXPLICIT_MODULES'] = 'NO'
      end
    end
  end
`;

const withNonModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn('[withNonModularHeaders] Podfile not found, skipping.');
        return config;
      }

      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes('CLANG_ENABLE_EXPLICIT_MODULES')) {
        console.log('[withNonModularHeaders] Already patched, skipping.');
        return config;
      }

      // Remove old patch if present (from previous version)
      if (contents.includes('ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        contents = contents.replace(
          /\n\s*# Fix.*?ALLOW_NON_MODULAR_INCLUDES.*?end\n/s,
          '\n'
        );
      }

      if (/post_install\s+do\s+\|installer\|/.test(contents)) {
        contents = contents.replace(
          /post_install\s+do\s+\|installer\|/,
          `post_install do |installer|\n${INJECT_BLOCK}`
        );
        console.log('[withNonModularHeaders] Injected into existing post_install block.');
      } else {
        contents += `\npost_install do |installer|\n${INJECT_BLOCK}\nend\n`;
        console.log('[withNonModularHeaders] Created new post_install block.');
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withNonModularHeaders;