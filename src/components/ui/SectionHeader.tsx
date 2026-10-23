import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/constants/useColors";
import { FontSizes, Fonts } from "@/constants/theme";

/**
 * Section heading with an optional action. The action keeps a 44px tap target
 * even though it reads as a text link.
 */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();

  return (
    <View style={styles.row}>
      <Text
        style={[styles.title, { color: c.text }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.actionText, { color: c.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.title,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  action: {
    minHeight: 44,
    justifyContent: "center",
  },
  actionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.label,
  },
});
