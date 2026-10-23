import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useColors } from "@/constants/useColors";
import { Cabinet } from "@/constants/theme";

/**
 * The page shell for tab screens: warm canvas, safe area at the top, and the
 * tab bar owns the bottom inset. Detail screens keep their native stack header
 * and use their own scroll container.
 */
export function Screen({
  children,
  style,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}) {
  const c = useColors();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: c.background }, style]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

/** Vertical page scroll with the care gutter and a clear bottom edge. */
export function ScreenScroll({
  children,
  contentContainerStyle,
  refreshControl,
  style,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={[styles.divider, { backgroundColor: c.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Cabinet.gutter,
    paddingBottom: 32,
  },
  divider: { height: StyleSheet.hairlineWidth },
});
