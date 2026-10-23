import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

/** A blank state that explains what is missing and offers the fix. */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();

  return (
    <View style={[styles.wrap, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.iconTile, { backgroundColor: c.mint }]}>
        <Icon name={icon} size={26} color={c.primary} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 8,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
    textAlign: "center",
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: 23,
    textAlign: "center",
  },
  action: { alignSelf: "stretch", marginTop: 10 },
});
