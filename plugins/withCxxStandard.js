/**
 * Custom Expo config plugin to fix 'folly/coro/Coroutine.h' file not found
 * error when building with React Native 0.81+ on iOS.
 *
 * Folly requires C++20 for coroutines support. This plugin sets
 * CLANG_CXX_LANGUAGE_STANDARD = c++20 for all CocoaPods targets
 * via a Podfile post_install hook.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CPP_SETTING = `
  # Fix: 'folly/coro/Coroutine.h' file not found (React Native 0.81 requires C++20)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
    end
  end
`;

const withCxxStandard = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let contents = fs.readFileSync(podfilePath, 'utf-8');

      // Skip if c++20 is already explicitly set
      if (contents.includes("'c++20'") || contents.includes('"c++20"')) {
        return config;
      }

      // Inject inside existing post_install block (Expo always generates one)
      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${CPP_SETTING}`
        );
      } else {
        // Fallback: append a new post_install block
        contents += `\npost_install do |installer|\n${CPP_SETTING}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      console.log('[withCxxStandard] Set CLANG_CXX_LANGUAGE_STANDARD=c++20 in Podfile');
      return config;
    },
  ]);
};

module.exports = withCxxStandard;
