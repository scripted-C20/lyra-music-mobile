const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const exclusionList = require('metro-config/src/defaults/exclusionList')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ignore native build outputs inside dependencies. On Windows these folders
    // can appear/disappear during Gradle/KSP work and crash Metro's file watcher.
    blockList: exclusionList([
      /.*\/node_modules\/.*\/android\/build\/.*/,
      /.*\/node_modules\/.*\/android\/\.cxx\/.*/,
      /.*\/node_modules\/.*\/ios\/build\/.*/,
    ]),
    extraNodeModules: {
      // crypto: require.resolve('react-native-quick-crypto'),
      // stream: require.resolve('stream-browserify'),
      buffer: require.resolve('@craftzdog/react-native-buffer'),
    },
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
