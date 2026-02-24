# Native Crash Analysis Report

> Generated automatically during the investigation of the production APK crash.

---

## 🔍 Summary

- App runs fine in Expo Go (development) but **immediately exits** when navigating off home in production APK.
- No JS exception is reported; global JS handler never fires – indicates **native crash**.
- Crash triggered when navigation occurs (router.push, header button) or when any screen uses Reanimated/Animated.
- Likely causes: mis‑configured Reanimated, incompatible native modules, Fabric/new arch edge cases.

---

## ✅ Configuration checks

| Item | Correct? | Details |
|------|----------|---------|
| `react-native-reanimated` import order | ❌ not first | Appears after other imports in `app/_layout.tsx` and `(tabs)/_layout.tsx`.
| Babel plugin for Reanimated | ❌ wrong plugin (`react-native-worklets/plugin`) |
| Plugin order | ❌ only one plugin (wrong one) – must be **last** if others present |
| `useNativeDriver` usage | ⚠️ present in several `Animated.timing` calls | only affects `react-native` Animated; may crash on Fabric if unsupported props.
| `newArchEnabled` | ⚠️ enabled (SDK 54) | many libraries not guaranteed compatibility; mismatched support can silently crash.
| Duplicate native libs | ✅ none detected | `npm ls` shows single versions of reanimated, screens, gesture-handler.


### Entry/Root layout files

`app/_layout.tsx` (lines 1–8) and identical `(tabs)/_layout.tsx` import `react-native-reanimated` as the 6th/7th statement, **after** other modules:

```ts
import { DesignProvider } from '@/src/context/DesignContext';
import { ProfileProvider } from '@/src/context/ProfileContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';          // <- should be FIRST line
```

Reanimated documentation mandates this import appear *before* any other code/JS import (especially before `react-native` or navigation) so the JSI runtime is installed before any worklet is registered. Failing to do so leads to native crashes in release builds when a worklet executes (navigation transitions, gesture handlers, etc.). Expo Go may mask the problem due to its slow Metro bundler and non‑Hermes JS engine.

### Babel configuration

Current `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
```

- Plugin must be **`'react-native-reanimated/plugin'`**.
- It must also be **last** in the `plugins` array. If additional plugins are added later (e.g. `module:metro-react-native-babel-preset`, others), it must remain last.
- The current plugin (`react-native-worklets/plugin`) is for the standalone `react-native-worklets` package and does *not* compile Reanimated worklets. In production the worklet source code is left untransformed, causing a JSI crash when it runs.*

### `useNativeDriver` calls

Animated timing with `useNativeDriver: true` is used in

- `src/components/AppHeader.tsx` (menu slide)
- `src/screens/CreateEditEventScreen.tsx` (popup menu)
- `src/screens/TrashScreen.tsx` etc.

If the native driver cannot handle the animated style (e.g. `translateX` is fine, but running on Fabric without proper support can lead to a crash). Switching to the JS driver is a useful debugging step.

### New architecture / Fabric

`app.json` contains:

```json
"newArchEnabled": true
```

Fabric and the new architecture were experimental in SDK 54. Some third‑party native modules (particularly `react-native-reanimated` <4.2.0, `react-native-gesture-handler`, `react-native-screens`) required explicit patches. Enabling the new arch increases the risk of silent native crashes, especially when combined with mis‑configured Babel (above).

Given that the crash occurs only when navigating (which triggers reanimated) and the project hasn’t been verified with new arch, **disabling `newArchEnabled` is strongly advised** until the configuration is corrected and all dependencies support Fabric.

### Dependency versions

`npm ls` output:

```
react-native-gesture-handler@2.28.0
react-native-reanimated@4.1.6
react-native-screens@4.16.0
```

All are deduped to a single copy. No version mismatches were found in `node_modules`.

---

## 🔥 High‑probability crash causes

1. **Reanimated initialization order** – navigation or any component that registers a worklet executes *before* the runtime is ready. This leads to a crash in release/Hermes, frequently observed as the app closing immediately with no JS error. (Worklet registration on `router.push`/screen mount triggers crash.)
2. **Incorrect Babel plugin** – Reanimated functions (`useAnimatedStyle`, `interpolate`, etc.) aren’t compiled. Worklets remain as raw arrow functions; Hermes tries to move them to native and fails, causing a native abort. This is a deterministic crash in prod but not in dev.
3. (Secondary) `newArchEnabled`: If Reanimated isn’t built with Fabric support or if `react-native-reanimated/plugin` isn’t run, the native module's initialization may corrupt Fabric’s JSI host objects, causing hard crashes.
4. `useNativeDriver: true` may exacerbate the crash when a timing animation starts and fails; this is why navigating (which triggers a built‑in reanimated transition) and manually opening the header menu both kill the app.

---

## 💡 Why Expo Go works but APK doesn’t

- Expo Go bundles a non‑Hermes JS engine and runs in development mode; untransformed worklets may still execute because Metro injects extra helpers, and JSI is not strict.
- In development, the runtime eagerly recompiles or bypasses certain optimizations; production bundles are minified, Hermes is enabled, and the missing Babel transform leads to invalid bytecode being passed to JSI.
- Native modules are linked differently in Expo Go versus a standalone build; the requirement that reanimated import come first is enforced only when the library is statically linked (as in the APK).

---

## ✅ Fix instructions

1. **Correct the Babel config** (`babel.config.js`):

```diff
 module.exports = function (api) {
   api.cache(true);
   return {
     presets: ['babel-preset-expo'],
-    plugins: ['react-native-worklets/plugin'],
+    plugins: [
+      // any other custom plugins go here
+      'react-native-reanimated/plugin', // must be last
+    ],
   };
 };
```

2. **Move `react-native-reanimated` import to the very top** of both root layout files and any other entry point used by the bundler (e.g. `index.js` if present):

```ts
// app/_layout.tsx and app/(tabs)/_layout.tsx
import 'react-native-reanimated'; // <<< FIRST line before all others

import { DesignProvider } from '@/src/context/DesignContext';
// ... rest of imports
```

3. **Optionally disable new architecture** until everything is confirmed working:

```diff
   "ios": {
     "supportsTablet": true
   },
   "android": {
     // ...
   },
-  "newArchEnabled": true,
+  // temporarily disable to avoid Fabric-related issues
+  "newArchEnabled": false,
```

4. **Temporarily change `useNativeDriver` to `false`** in suspect animations to isolate the problem (optional debugging):

```ts
Animated.timing(slideAnim, {
  toValue: menuPanelVisible ? 0 : -DRAWER_WIDTH,
  duration: 250,
-  useNativeDriver: true,
+  useNativeDriver: false, // switch to JS driver while verifying crash gone
});
```

5. **Rebuild and test**:
   1. Clear Metro cache: `expo start -c` or `npm run reset-project`.
   2. Run `eas build --platform android --profile production`.
   3. Install APK on device/emulator and navigate between screens.

6. **Once fixed, re‑enable newArchEnabled** if needed and confirm all native modules have Fabric support (upgrade `react-native-reanimated` to latest if required).

7. **Add a guard** (optional) around routing code to catch errors during development:

```ts
try {
  router.push('/profile');
} catch (e) {
  console.error('router.push failed', e);
}
```

---

## 🏁 Final root cause conclusion

The crash is almost certainly caused by mis‑configured **react-native-reanimated**:

- The library was not initialized early (wrong import order) and
- Babel was not transforming worklets (incorrect plugin name).

Combined with Hermes and the Expo standalone build’s stricter runtime, this results in a native JSI abort whenever navigation triggers a worklet or when an animation runs. Expo Go’s development environment masks these issues, which is why the bug only appears in the production APK.

Secondary factors such as `useNativeDriver` and `newArchEnabled` increase the likelihood of a crash but are not the primary triggers. Fixing the Reanimated configuration will eliminate the silent app termination.

---

> ✅ **Action items**: update imports & Babel, rebuild, verify. Consider temporarily disabling the new architecture.

*Report generated by GitHub Copilot.*
