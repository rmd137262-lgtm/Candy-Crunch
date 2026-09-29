import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Prevent release mode from killing app on unhandled startup errors
if (typeof global !== "undefined" && (global as any).ErrorUtils) {
  (global as any).ErrorUtils.setGlobalHandler((error: any) => {
    console.warn("Handled startup error safely:", error);
  });
}

if (!__DEV__) {
  LogBox.ignoreAllLogs(true);
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    // Hide after the font loader settles. Do not keep the native splash
    // locked at module scope, where a startup import failure could leave it
    // visible forever.
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
