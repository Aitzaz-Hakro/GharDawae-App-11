import { View } from "react-native";

/**
 * A magnifier drawn from two views instead of an emoji or a glyph.
 *
 * Why not the emoji: it renders as a blue-and-white cartoon on Android and
 * shifts weight between platforms. Why not "⌕": several Android system fonts
 * do not carry it, so it renders as a tofu box on a low-end phone. Two shapes
 * always render, scale cleanly and take the theme's colour.
 */
export function Magnifier({ size = 16, color }: { size?: number; color: string }) {
  const ring = Math.round(size * 0.72);
  const handle = Math.max(2, Math.round(size * 0.11));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: handle,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: handle,
          height: Math.round(size * 0.42),
          backgroundColor: color,
          borderRadius: handle,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}
