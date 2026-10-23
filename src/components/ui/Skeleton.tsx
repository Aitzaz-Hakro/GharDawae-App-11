import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/constants/useColors";
import { Radii } from "@/constants/theme";

/**
 * A static placeholder sized like the card it replaces, so the layout does not
 * jump when data arrives. Motion is optional, never required to read the state.
 */
export function Skeleton({
  height,
  width,
  radius = Radii.md,
  style,
}: {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: c.surfaceSelected,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: { overflow: "hidden" },
});
