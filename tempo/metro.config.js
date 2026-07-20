// @tempo-owned: expo-metro-config
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const sidecarNodeModules = path.join(projectRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

// Resolve packages via their legacy `main`/`react-native`/`browser` fields
// (CJS) instead of the modern `exports` conditions. Some deps ship an ESM
// build under `exports["import"]` that uses Vite-isms (`import.meta.env.MODE`,
// `import.meta.url`) — e.g. zustand 5's `./esm/middleware.mjs`, which a store
// using `zustand/middleware` pulls in. On web Metro matches the `import`
// condition and bundles that ESM build verbatim (it does NOT transform
// `import.meta`), so the module throws "Cannot use 'import.meta' outside a
// module" the moment it loads in the classic-script web bundle — taking the
// storyboard that imported it down with it. Disabling package exports makes
// Metro fall back to `main` (CJS, no `import.meta`). Tightening the condition
// set alone is NOT enough — Metro still picks the ESM build for web. The
// trade-off: a package that ONLY ships via `exports` (no `main`) won't
// resolve, but those are rare in the Expo/RN ecosystem (RN requires CJS).
config.resolver.unstable_enablePackageExports = false;

// Storybook stub. Storybook for React Native leaks into a canvas's module
// graph (a canvas importing `@/app/storybook`, Expo Router auto-discovering
// `app/storybook.tsx`, or `.rnstorybook/storybook.requires` globbing every
// `*.stories.*` file). It then pulls on-device addons (`@storybook/addon-*`)
// and native-only deps (`@gorhom/bottom-sheet`) that aren't installed for web,
// failing the WHOLE bundle (eager canvas requires mean one broken canvas
// breaks all). Storybook is never rendered in a canvas, so the resolveRequest
// hook below substitutes any storybook/story import with an inert stub
// (emitted at `.tempo-storybook-stub.js`). The matching tests live in the
// metro-resolve suite.
const tempoStorybookStub = path.resolve(projectRoot, ".tempo-storybook-stub.js");
const isStorybookModule = (name) =>
  name.includes("storybook") || /\.stories(\.|$)/.test(name);

// NOTE: We deliberately do NOT `require()` and inherit the user app's
// metro.config.js. Many real configs (NativeWind via withNativeWind, Storybook
// via withStorybook) throw when evaluated outside their own project context
// ("Tailwind CSS has not been configured with the NativeWind preset"), which
// would break the whole sidecar bundle. Per-feature support (svg transformer,
// NativeWind, web shims) is added explicitly here rather than by wholesale
// config inheritance.
const userMetroResolveRequest = null;

const sidecarModule = (moduleName) =>
  path.join(sidecarNodeModules, ...moduleName.split("/"));
const singletonModules = {
  react: sidecarModule("react"),
  "react-dom": sidecarModule("react-dom"),
  "react-native": sidecarModule("react-native"),
  "react-native-web": sidecarModule("react-native-web"),
  "react/jsx-runtime": sidecarModule("react/jsx-runtime.js"),
  "react/jsx-dev-runtime": sidecarModule("react/jsx-dev-runtime.js"),
};

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    sidecarNodeModules,
    path.join(workspaceRoot, "node_modules"),
    ...(config.resolver.nodeModulesPaths ?? []),
  ]),
);
// Hierarchical lookup stays ENABLED so Metro can walk parent directories to
// resolve transitively-nested deps (e.g. react-native-reanimated@4's bundled
// semver@7, required by its scripts/validate-worklets-version.js — the
// root-hoisted semver@6 has no functions/satisfies subpath, so disabling the
// walk fails the canvas at module load: "Unable to resolve module
// semver/functions/satisfies").
//
// The trade-off: with hierarchical lookup on, Metro's resolver.alias /
// extraNodeModules become FALLBACKS — a hierarchical walk can find a
// duplicate React copy nested under some package BEFORE the alias applies,
// which surfaces as "Invalid hook call ... more than one copy of React". So
// the React singleton is NOT enforced via alias here; it's enforced via the
// resolveRequest hook below, which takes precedence over ALL resolution.
config.resolver.disableHierarchicalLookup = false;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  ...singletonModules,
};
config.resolver.alias = {
  ...(config.resolver.alias ?? {}),
  ...singletonModules,
};

// React-family packages that MUST resolve to exactly one copy (the sidecar's),
// no matter which module imports them or how deeply nested it is. react +
// react-dom are the renderer/runtime pair whose duplication causes "Invalid
// hook call" — forcing them through resolveRequest (which runs before
// hierarchical resolution) is the only reliable singleton guarantee once
// hierarchical lookup is on. react-native / react-native-web are deliberately
// NOT forced here: on web, Expo's own resolver swaps react-native ->
// react-native-web by platform, and intercepting it would break that swap.
const forcedReactSingletons = {
  react: path.join(sidecarNodeModules, "react"),
  "react-dom": path.join(sidecarNodeModules, "react-dom"),
};
const tempoSdkRuntimeModules = {
  "tempo-sdk/canvas": path.join(sidecarNodeModules, "tempo-sdk", "dist", "canvas", "index.js"),
  "tempo-sdk/assets": path.join(sidecarNodeModules, "tempo-sdk", "dist", "assets", "index.js"),
};

// Mirror the user app's tsconfig.paths so canvas imports like
// "@/app/components/X" resolve through Metro the same way TypeScript and
// the user's app already resolve them. The aliases array below is baked
// in at scaffold time (regenerated on every ensureInitialized pass when
// the user's tsconfig changes).
const tempoTsconfigAliases = [{"prefix":"@/","target":"../src"}].map((a) => ({
  prefix: a.prefix,
  target: path.resolve(projectRoot, a.target),
}));

// Web shims for native-only modules: { "react-native-maps": "../web-shims/..." }.
// Native-only RN modules (react-native-maps, expo-camera, …) cannot bundle on
// web — Metro throws "Importing native-only module … on web" and the whole
// bundle fails. The app keeps browser stand-ins in a web-shims/ dir; we
// replicate the mapping so any canvas transitively importing one still bundles.
const tempoWebShims = {};

// Always install the resolveRequest hook (even with no tsconfig aliases) so
// the React singleton enforcement runs on every project. Order:
//   1. React singletons (highest priority — must win over everything).
//   2. Tempo SDK runtime subpaths that package-exports-disabled Metro cannot
//      resolve through package.json exports.
//   3. Web shims (web platform only) for native-only modules.
//   4. User @/ tsconfig aliases (canvas imports of app source).
//   5. Expo's default resolver (owns the web react-native -> react-native-web
//      swap).
const baseResolveRequest = userMetroResolveRequest || config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isStorybookModule(moduleName)) {
    return { type: "sourceFile", filePath: tempoStorybookStub };
  }
  for (const pkg of Object.keys(forcedReactSingletons)) {
    const pkgRoot = forcedReactSingletons[pkg];
    if (moduleName === pkg) {
      return context.resolveRequest(context, pkgRoot, platform);
    }
    if (moduleName.startsWith(pkg + "/")) {
      const subpath = moduleName.slice(pkg.length + 1);
      return context.resolveRequest(
        context,
        path.join(pkgRoot, subpath),
        platform,
      );
    }
  }
  const tempoSdkRuntimeModule = tempoSdkRuntimeModules[moduleName];
  if (tempoSdkRuntimeModule) {
    return context.resolveRequest(context, tempoSdkRuntimeModule, platform);
  }
  if (platform === "web") {
    const shimRel = tempoWebShims[moduleName];
    if (shimRel) {
      return {
        type: "sourceFile",
        filePath: path.resolve(projectRoot, shimRel),
      };
    }
  }
  for (const { prefix, target } of tempoTsconfigAliases) {
    if (moduleName.startsWith(prefix)) {
      const rewritten = path.join(target, moduleName.slice(prefix.length));
      return context.resolveRequest(context, rewritten, platform);
    }
  }
  if (baseResolveRequest) {
    return baseResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Metro's transform cache key does not include process.env.TEMPO, but the
// Tempo Babel plugin only annotates when TEMPO=true. Without this, a cache
// built while TEMPO was unset is reused (un-annotated) even after restarting
// with TEMPO=true. Key the cache on TEMPO so on/off use separate namespaces.
//
// The "metrocfg-v2" token is a manual version stamp for THIS config template.
// Bump it whenever the resolver config changes shape (alias set, hierarchical
// lookup, resolveRequest behavior). Metro's on-disk transform + serializer
// cache persists across restarts and is NOT keyed on metro.config.js content,
// so without a stamp bump a resolver change reshuffles module IDs while stale
// cached chunks still reference the old IDs — surfacing as "Requiring unknown
// module <n>". Bumping the stamp forces a clean rebuild.
config.cacheVersion = [
  config.cacheVersion,
  "tempo-metrocfg-v11",
  `tempo-${process.env.TEMPO === "true" ? "on" : "off"}`,
]
  .filter(Boolean)
  .join("~");

module.exports = config;
