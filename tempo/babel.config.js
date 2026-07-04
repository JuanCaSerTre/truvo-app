// @tempo-owned: expo-babel-config
const { tempoExpoBabelPlugin } = require("tempo-sdk/expo/plugin");

module.exports = function (api) {
  // The Tempo plugin only annotates when TEMPO=true. Key Babel's config cache
  // on TEMPO (instead of api.cache(true)) so toggling it re-evaluates the
  // config rather than reusing a stale build.
  api.cache.using(() => process.env.TEMPO);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        tempoExpoBabelPlugin,
        {
          // Annotate filepaths relative to the Tempo sidecar root (this dir),
          // matching the Next.js sidecar convention. The canvas resolves
          // `data-tempo-filepath` against the `tempo-project-root` meta (also
          // this dir), so parent app code resolves via `../src/...`.
          root: __dirname,
        },
      ],
    ],
  };
};
