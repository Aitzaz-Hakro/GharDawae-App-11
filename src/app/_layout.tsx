import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { usePowerSyncSync } from "@/lib/powersync/sync";

SplashScreen.preventAutoHideAsync();

/**
 * Auth gate: redirect based on session.
 * - logged in  -> (main)  (family grid — opens instantly, offline-friendly)
 * - logged out -> (auth)  (login)
 */
function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(main)");
    }
  }, [session, loading, segments, router]);
}

function RootNavigator() {
  const { loading } = useAuth();
  useProtectedRoute();
  // Connect local PowerSync DB <-> Supabase whenever signed in (no-op offline).
  usePowerSyncSync();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
