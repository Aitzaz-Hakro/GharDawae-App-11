import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { Fonts, Radii } from "@/constants/theme";

export type ShortcutTone = "peach" | "mint" | "tan";

/**
 * A whole-card shortcut: icon tile, short label, one supporting line. The card
 * is the tap target, not just the icon.
 */
export function ShortcutCard({
  icon,
  title,
  description,
  tone,
  onPress,
  style,
}: {
  icon: IconName;
  title: string;
  description: string;
  tone: ShortcutTone;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const background =
    tone === "peach" ? c.peach : tone === "mint" ? c.mint : c.tan;
  const ink =
    tone === "peach" ? c.onPeach : tone === "mint" ? c.onMint : c.text;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.card, { backgroundColor: background, borderColor: c.border }, style]}
    >
      <View style={[styles.iconTile, { backgroundColor: c.surface }]}>
        <Icon name={icon} size={22} color={c.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.description, { color: ink }]} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    minHeight: 118,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { gap: 3 },
  title: {
    fontFamily: Fonts.headingSemi,
    fontSize: 15,
    lineHeight: 19,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 17,
    opacity: 0.85,
  },
});
