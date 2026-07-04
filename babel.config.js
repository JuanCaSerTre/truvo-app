const path = require('node:path');
const { tempoExpoBabelPlugin } = require('tempo-sdk/expo/plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [[tempoExpoBabelPlugin, { root: path.resolve(__dirname) }], 'react-native-reanimated/plugin'],
  };
};
