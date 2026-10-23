import { Stack } from "expo-router";
import { useMemo } from "react";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { FontSizes, FontWeights } from "@/constants/theme";

/**
 * Native-stack chrome, themed. Without this the header stays iOS-system blue
 * and the push/pop transition flips to the system background — a second visual
 * world next to the one the screens build.
 */
export default function MainLayout() {
  const c = useColors();
  const screenOptions = useMemo(
    () => makeScreenOptions(c),
    // Only the colours matter here; rebuilding on unrelated palette identity
    // changes is cheap and keeps the object stable per scheme.
    [c.background, c.border, c.primary, c.text],
  );

  return <Stack screenOptions={screenOptions} />;
}

function makeScreenOptions(c: ThemePalette) {
  return {
    headerShown: false,
    contentStyle: { backgroundColor: c.background },
    headerStyle: { backgroundColor: c.background },
    headerTintColor: c.primary,
    headerTitleStyle: {
      color: c.text,
      fontSize: FontSizes.heading,
      fontWeight: FontWeights.heading,
    },
    headerShadowVisible: false,
    headerBackTitle: "Back",
  } as const;
}
