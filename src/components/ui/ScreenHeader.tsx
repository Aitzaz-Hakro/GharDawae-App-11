import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * One predictable header: 44px leading target, a centred title, and a trailing
 * action. Detail screens that still use the native stack header do not render
 * this; the tab screens do.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  left,
}: {
  title: string;
  subtitle?: string;
  onBack?: boolean;
  right?: ReactNode;
  left?: ReactNode;
}) {
  const c = useColors();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: c.surface, borderColor: c.border },
              pressed && styles.pressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color={c.text} />
          </Pressable>
        ) : (
          left
        )}
      </View>

      <View style={styles.titleWrap}>
        <Text
          style={[styles.title, { color: c.text }]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideEnd]}>{right}</View>
    </View>
  );
}

/** Circular icon control used in headers and app bars. */
export function IconButton({
  icon,
  label,
  onPress,
  tone = "surface",
  badge = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onPress: () => void;
  tone?: "surface" | "primary";
  badge?: boolean;
}) {
  const c = useColors();
  const primary = tone === "primary";

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: primary ? c.primary : c.surface,
          borderColor: primary ? c.primary : c.border,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={22} color={primary ? c.onPrimary : c.text} />
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: c.peachAccent, borderColor: c.surface },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: Cabinet.gutter,
    gap: 12,
  },
  side: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  sideEnd: { alignItems: "flex-end" },
  titleWrap: { flex: 1, alignItems: "center" },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    marginTop: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.78 },
  badge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});
