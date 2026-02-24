import 'react-native-reanimated';

import { DesignProvider } from '@/src/context/DesignContext';
import { ProfileProvider } from '@/src/context/ProfileContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * 🔥 PRODUCTION ERROR HANDLER
 * Release mode la crash aana
 * silent close aagathu
 * instead popup la error show aagum
 */
if (!__DEV__) {
  const defaultHandler =
    (global as any).ErrorUtils?.getGlobalHandler?.();

  (global as any).ErrorUtils?.setGlobalHandler?.(
    (error: any, isFatal: boolean) => {
      Alert.alert(
        "Production Error",
        error?.message || "Unknown error occurred"
      );

      defaultHandler?.(error, isFatal);
    }
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <DesignProvider>
          <ProfileProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="dark" />
          </ProfileProvider>
        </DesignProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}