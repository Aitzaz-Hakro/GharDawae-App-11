import { View } from "react-native";

/**
 * A camera mark drawn from three views. The 📷 emoji renders as a colour
 * cartoon on Android and cannot take the theme's ink; a glyph would need a font
 * the low-end target may not ship. Two rounded rectangles always render.
 */
export function CameraMark({ size = 28, color }: { size?: number; color: string }) {
  const stroke = Math.max(1.5, size * 0.08);
  const bodyHeight = size * 0.66;

  return (
    <View
      style={{ width: size, height: size, justifyContent: "flex-end" }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Viewfinder bump on top of the body. */}
      <View
        style={{
          position: "absolute",
          top: size - bodyHeight - stroke * 2,
          left: size * 0.3,
          width: size * 0.3,
          height: stroke * 2,
          borderTopLeftRadius: stroke,
          borderTopRightRadius: stroke,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size,
          height: bodyHeight,
          borderRadius: size * 0.16,
          borderWidth: stroke,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: size * 0.17,
            borderWidth: stroke,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}
