// Required for react-native-reanimated (v4) to work in production/APK builds.
// Reanimated v4 uses react-native-worklets/plugin; it must be listed last.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
