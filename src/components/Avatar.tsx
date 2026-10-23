import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Svg, { Circle, Path } from "react-native-svg";

import {
  avatarPresetForStoredValue,
  avatarTintForStoredValue,
  type AvatarTint,
} from "@/constants/avatars";
import { photoUri } from "@/lib/photo";
import { Radii } from "@/constants/theme";

export type AvatarProps = {
  /** Member name, used only for the accessible label. */
  name: string | null | undefined;
  /** Stored avatar_type: 'preset' (tint id) or 'photo' (file path / URL). */
  type?: "preset" | "photo" | string | null;
  /** Stored avatar_value. */
  value?: string | null;
  size?: number;
  /** Draws the focus ring, e.g. on the selected avatar chip. */
  selected?: boolean;
  ringColor?: string;
  accessibilityLabel?: string;
};

/**
 * A bundled illustrated portrait on the person's colour, or their own photo.
 * Same object at every size (grid 64, header 80, picker 48, search 40).
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
  const tint = useMemo(() => avatarTintForStoredValue(value), [value]);
  const preset = avatarPresetForStoredValue(value);
  const styles = useMemo(
    () => makeStyles(size, selected, ringColor),
    [size, selected, ringColor],
  );
  const src = type === "photo" && value ? photoUri(value) ?? value : null;

  return (
    <View
      style={[styles.stamp, { backgroundColor: tint.background }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ?? (name ? `${name}'s avatar` : "Member avatar")
      }
    >
      <AvatarImage
        key={src ?? preset.id}
        source={src ? { uri: src } : preset.source}
        contentFit={src ? "cover" : "contain"}
        fallbackColor={tint.ink}
      />
    </View>
  );
}

/** Keyed by source so an old image error never hides a newly selected avatar. */
function AvatarImage({
  source,
  contentFit,
  fallbackColor,
}: {
  source: ImageSource | number;
  contentFit: "cover" | "contain";
  fallbackColor: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Svg width="70%" height="70%" viewBox="0 0 24 24" accessible={false}>
        <Circle cx={12} cy={7} r={4} fill={fallbackColor} />
        <Path d="M4 22v-2a8 8 0 0 1 16 0v2Z" fill={fallbackColor} />
      </Svg>
    );
  }
  return (
    <Image
      source={source}
      style={imageStyles.image}
      contentFit={contentFit}
      accessible={false}
      onError={() => setFailed(true)}
    />
  );
}

const imageStyles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
});

const makeStyles = (size: number, selected: boolean, ringColor?: string) =>
  StyleSheet.create({
    stamp: {
      width: size,
      height: size,
      borderRadius: Radii.pill,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: selected ? Math.max(2, Math.round(size / 20)) : 0,
      borderColor: selected ? ringColor ?? "transparent" : "transparent",
    },
  });

export type { AvatarTint };
