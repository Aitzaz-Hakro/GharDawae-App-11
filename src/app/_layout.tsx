import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { usePowerSyncSync } from "@/lib/powersync/sync";
import { LanguageProvider } from "@/i18n";
import { Colors } from "@/constants/theme";
import { useColors } from "@/constants/useColors";

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
  const c = useColors();
  useProtectedRoute();
  // Connect local PowerSync DB <-> Supabase whenever signed in (no-op offline).
  usePowerSyncSync();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
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

/**
 * Expo Router's own theme object drives navigator backgrounds and the system
 * header. Left at the defaults it paints iOS blue and pure white over a themed
 * app, so it is derived from the same palette as everything else.
 */
function useNavigationTheme() {
  const scheme = useColorScheme();
  const palette = Colors[scheme === "dark" ? "dark" : "light"];
  return useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.primary,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        notification: palette.accent,
      },
    };
  }, [scheme, palette]);
}

export default function RootLayout() {
  const theme = useNavigationTheme();
  // Each weight is a separate family: React Native synthesises bold badly on
  // Android, so the app never asks a 700 file for fontWeight 700.
  const [fontsLoaded, fontError] = useFonts({
    SourceSans3_400: require("../../assets/fonts/SourceSans3-400.ttf"),
    SourceSans3_600: require("../../assets/fonts/SourceSans3-600.ttf"),
    SourceSans3_700: require("../../assets/fonts/SourceSans3-700.ttf"),
    NunitoSans_600: require("../../assets/fonts/NunitoSans-600.ttf"),
    NunitoSans_700: require("../../assets/fonts/NunitoSans-700.ttf"),
    NunitoSans_800: require("../../assets/fonts/NunitoSans-800.ttf"),
  });

  // A font failure must never block the offline path (design non-negotiable 1):
  // fall back to system type rather than trapping the user on the splash.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={theme}>
      <LanguageProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
