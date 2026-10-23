import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export type FeatureTone = "peach" | "mint" | "plain";

/**
 * A full-width action row used by Services, Connect and Profile: readable title,
 * one line of context, and a clear destination.
 */
export function FeatureCard({
  icon,
  title,
  description,
  onPress,
  tone = "plain",
  trailing,
}: {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  tone?: FeatureTone;
  trailing?: React.ReactNode;
}) {
  const c = useColors();
  const background =
    tone === "peach" ? c.peach : tone === "mint" ? c.mint : c.surface;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={[styles.card, { backgroundColor: background, borderColor: c.border }]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: tone === "plain" ? c.mint : c.surface },
        ]}
      >
        <Icon name={icon} size={22} color={c.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: c.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ?? <Icon name="caret-right" size={20} color={c.textSecondary} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    padding: 14,
    borderRadius: Cabinet.blockRadius,
    borderWidth: 1,
    marginBottom: Cabinet.gap,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 2 },
  title: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 19,
  },
});
