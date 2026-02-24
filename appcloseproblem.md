# 📦 Production App Crash Diagnostic

**Context:**
- Environment: Expo Router React Native project (SDK 54). 
- Behavior: Works flawlessly in Expo Go (`__DEV__` mode). 
- Problem: EAS production APK launches to Home screen, but any user interaction that triggers navigation or state changes (profile button tap, menu toggle, pushing new route, etc.) causes the app to immediately quit with no visible error dialog.
- No crash log shown to end‑user; app simply closes. Global JS error handler in `app/_layout.tsx` is never invoked, implying a native crash.

---

## 🔍 Why this only happens in production build
1. **Different JS engine & minification** – Hermès + ProGuard strip debug info. 
2. **`__DEV__` flag false** – many code paths, hooks and error handlers are gated.
3. **Native modules are linked differently** – Expo Go bundles a prebuilt runtime; EAS build compiles your native modules (new architecture, autolinking, etc.).
4. **Navigation transitions and animated drivers** tend to exercise native code that isn’t hit until you leave the initial screen.

Because the crash is silent and triggered by any interaction, the fault is almost certainly in a native module (Reanimated, `react-native-screens`, gesture handler, etc.) or in initialization order that only matters when native code runs.

---

## 🚨 High‑Probability Issues

| Probability | Issue | Location & Lines | Why it matters |
|------------|-------|------------------|----------------|
| 🔴 **Very High** | **Reanimated not initialized early** <br> - `import 'react-native-reanimated'` comes *after* other imports. <br>   Transitions performed by navigation will call into Reanimated before it has a chance to register the worklet runtime. | `app/_layout.tsx`, lines **1–8** and same in `(tabs)/_layout.tsx` | Reanimated docs: *must* be the very first import. Failure leads to native JSI crashes when a worklet executes. Production builds are more susceptible; Expo Go may mask the issue. |
| 🔴 **Very High** | **Wrong/missing Babel plugin for Reanimated** <br> plugin used is `'react-native-worklets/plugin'` but the package is `react-native-reanimated` (v4.1.1). | `babel.config.js` | If worklets are not transformed, the generated code calls into JSI with invalid pointers, triggering a fatal crash when navigation or any animated component runs. |
| 🔴 **Very High** | **`newArchEnabled: true` in `app.json`** | `app.json` – Android section | Enabling the new architecture compiles all native modules as Fabric/TurboModules. If even one dependency (e.g. `react-native-reanimated`, `react-native-gesture-handler`, `expo-file-system`, etc.) is not compatible or properly configured, the first call into that module (common during screen transitions or animations) will crash the process. Expo Go uses the old architecture, explaining why the problem is absent in development. |

These three items are tightly related: navigation animations + animated drawer rely on Reanimated / native drivers / screens, and the new architecture multiplies the chance of a native edge‑case causing an app kill.

---

## 🔧 Medium‑Probability Issues

- **`Animated.timing(..., { useNativeDriver: true })`** in `AppHeader` <br> (HomeScreen menu toggle). If the native animation driver fails (e.g. unsupported property or misconfigured Fabric wrapper) it can crash the app. File: `src/components/AppHeader.tsx` lines ~~20–35. <br> (but this would also happen on menu toggle, matching the reported symptom).
- **`Dimensions.get('window')`** used for drawer width – should be safe but a `0` value could produce crazy translations; not a crash.
- **`measureInWindow` call** in `HomeScreen` (line ~64) – carefully guarded with `?.` but if the ref is `null` at the wrong time it could throw on some devices; unlikely to kill the process.
- **AsyncStorage or FileSystem operations** in `CreateEditEventScreen` – errors are wrapped in try/catch, so they won't crash the app, but unhandled promise rejections could surface differently in release. <br> (Storage itself might not be linked correctly in new arch.)
- **Null/undefined access** – most locations already guard against `profile` being null. Only potential is `profile.name.charAt(0)` in `AppHeader.tsx` line 107; safe since there is a `profile.name` guard, but if `profile.name` were `undefined` the guard would skip the branch; not a crash.

---

## 🟡 Low‑Probability Issues

- Invalid image URI (e.g. null, empty string) – all uses guard with conditional rendering.
- JSON parsing (none found).
- Unhandled promises – most `async` functions use try/catch; even unhandled ones show alerts in dev.
- Any logic in `src/utils/*` (PDF export, image utils) only runs when the user exports or picks an image, which isn't needed to reproduce the crash on navigation.

---

## 📌 Why Expo Go behaves differently
- **Expo Go uses a pre‑built runtime** where all native modules are known to be compatible with the chosen SDK; it also disables the new architecture by default. <br> Your EAS build compiles native code with `newArchEnabled` and applies production bundling/minification. If a native module wasn't built with the same flags or required additional initialization (Reanimated, Gesture Handler, Screens), the first call into it can shut down the VM.
- In development, JS errors are surfaced via the red screen; silent native crashes rarely happen because the module versions are vetted by Expo. In production, any misconfiguration is fatal and *does not* trigger the JS global error handler.

---

## ✅ Recommended Fixes & Code Snippets

1. **Move Reanimated import to the top of the entry point.**
   ```tsx
   // app/_layout.tsx (and (tabs)/_layout.tsx)
   import 'react-native-reanimated'; // <<< MUST be first line

   import { DesignProvider } from '@/src/context/DesignContext';
   import { ProfileProvider } from '@/src/context/ProfileContext';
   // ... rest of imports unchanged
   ```
   > This ensures the Reanimated runtime is installed before any other module (navigation, gesture handler) can use it.

2. **Use the correct Babel plugin.**
   ```js
   // babel.config.js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       // put the reanimated plugin last
       plugins: [
         // other plugins…
         'react-native-reanimated/plugin',
       ],
     };
   };
   ```
   > Remove `react-native-worklets/plugin` unless you explicitly need the standalone package. After changing, clear Metro cache (`expo start -c`) and rebuild.

3. **Disable the new architecture until dependencies are confirmed compatible.**
   ```json
   // app.json
   {
     "expo": {
       // …
       "android": {
         // …
       },
       "newArchEnabled": false  // temporarily turn off
     }
   }
   ```
   > Alternatively, upgrade all native libraries to versions that explicitly support Fabric/TurboModules and follow each module's installation guide for the new architecture.

4. **Guard or remove native‑driver animation on the home menu.**
   ```tsx
   Animated.timing(slideAnim, {
     toValue: menuPanelVisible ? 0 : -DRAWER_WIDTH,
     duration: 250,
     useNativeDriver: false, // try JS driver while debugging
   }).start();
   ```
   > This change can help confirm whether the crash is coming from `Animated`'s native driver.

5. **Add try/catch around `router.push` calls** (optional for debugging). Example in `AppHeader`:
   ```tsx
   const handleProfilePress = () => {
     try {
       router.push('/profile');
     } catch (e) {
       console.error('router.push failed', e);
     }
   };
   ```

6. **Install and configure a crash‑reporting SDK** (Sentry, Bugsnag) in production so you can capture native stack traces instead of silent exits. This isn’t a fix but will make future investigation easier.

---

## 🛠 Step‑by‑Step Debugging Strategy
1. **Reproduce locally with a development build**: run `eas build --profile preview --platform android` and install the APK on a device/emulator. Confirm that navigation still crashes. Use `adb logcat` to capture logs around the crash—look for `FATAL EXCEPTION` from `libjsc.so` or `hermes` and `JNI DETECTED ERROR`.
2. **Toggle the suspects**:
   - Temporarily disable `newArchEnabled` and rebuild. If the crash disappears, the new architecture is the culprit.
   - Move the Reanimated import to the top and rebuild. If the crash disappears, the initialization order was the problem.
   - Swap the Babel plugin and rebuild. A crash-free run indicates a transformation issue.
   - Change `useNativeDriver` to `false` in `AppHeader` and see if tapping the menu still kills the app.
3. **Enable Hermes debug logging**: add `jsEngine: "hermes"` and run a build; inspect output for `Reanimated: Fatal` errors.
4. **Add try-catch/logs around suspected navigation and animation calls** to dump the JS stack into the log prior to crashing.
5. **Run `expo doctor` / `npm ls react-native-reanimated react-native-screens`** to ensure there are no duplicate versions.
6. **Check native compatibility**: read the release notes of each native library in `package.json` for new‑arch support, upgrade as necessary.
7. **Test on an emulator with USB debugging enabled** and attach Chrome debugger (Hermes). JS exceptions will show in the console prior to the crash if it’s not a pure native fault.

---

## 🏁 Final Conclusion
The silent production shutdown is almost certainly due to a **native crash triggered by misconfigured Reanimated / new architecture**. In Expo Go the app uses the proven prebuilt runtime (old architecture) and the problem never surfaces. The combination of:

1. Reanimated import not being first,
2. Incorrect Babel plugin,
3. `newArchEnabled` being true,

causes a fragile native interaction; the first navigation or animated state change executes a worklet or native animation driver that isn’t set up correctly, immediately terminating the process. Once the Reanimated runtime is correctly initialized and/or the new architecture is disabled, navigation should work normally, and the app will no longer exit on tapping profile, menu toggle, or pushing routes.

Follow the recommended fixes, rebuild with EAS, and monitor logs to confirm the crash no longer occurs.

---

> 💡 **Tip:** Try rebuilding a development client (`eas build --profile development`) with the above changes enabled; this will let you attach a debugger while still reproducing the crash without waiting for full production releases.

Good luck — the crash is fixable and most likely lies in the native layer configuration rather than your business logic.```}