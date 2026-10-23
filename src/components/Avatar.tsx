import { useMemo } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { Image } from "expo-image";

import {
  avatarInitials,
  avatarTintForStoredValue,
  type AvatarTint,
} from "@/constants/avatars";
import { photoUri } from "@/lib/photo";
import { FontWeights, Radii } from "@/constants/theme";

export type AvatarProps = {
  /** Member name — the letter(s) come from here. */
  name: string | null | undefined;
  /** Stored avatar_type: 'preset' (tint id) or 'photo' (file path / URL). */
  type?: "preset" | "photo" | string | null;
  /** Stored avatar_value. */
  value?: string | null;
  size?: number;
  /** Tints the ring, e.g. on the selected avatar chip. */
  selected?: boolean;
  ringColor?: string;
  accessibilityLabel?: string;
};

/**
 * The family's identity mark. A letter in a tinted stamp, or the member's
 * photo when one exists — the same object at every size (grid, header, form).
 */
export function Avatar({
  name,
  type,
  value,
  size = 56,
  selected = false,
  ringColor,
  accessibilityLabel,
}: AvatarProps) {
  const scheme = useColorScheme();
  const tint = useMemo(() => avatarTintForStoredValue(value), [value]);
  const isDark = scheme === "dark";
  const background = isDark ? tint.backgroundDark : tint.background;
  const ink = isDark ? tint.inkDark : tint.ink;
  const letter = avatarInitials(name);

  const styles = useMemo(
    () => makeStyles(size, selected, ringColor),
    [size, selected, ringColor],
  );

  const src = type === "photo" && value ? photoUri(value) ?? value : null;

  return (
    <View
      style={[styles.stamp, { backgroundColor: src ? "transparent" : background }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ?? (name ? `${name}'s avatar` : "Member avatar")
      }
    >
      {src ? (
        <Image source={{ uri: src }} style={styles.photo} contentFit="cover" />
      ) : (
        <Text style={[styles.letter, { color: ink }]} numberOfLines={1}>
          {letter}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (size: number, selected: boolean, ringColor?: string) =>
  StyleSheet.create({
    stamp: {
      width: size,
      height: size,
      borderRadius: Radii.pill,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: selected ? Math.max(2, Math.round(size / 22)) : 0,
      borderColor: selected ? ringColor ?? "transparent" : "transparent",
    },
    photo: { width: size, height: size },
    letter: {
      // Scales with the stamp: readable at 36, not shouty at 96.
      fontSize: Math.round(size * 0.42),
      lineHeight: Math.round(size * 0.5),
      fontWeight: FontWeights.heading,
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
  });

export type { AvatarTint };
