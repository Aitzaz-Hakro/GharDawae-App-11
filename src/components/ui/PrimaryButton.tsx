import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * The single primary action. Deep green is reserved for this; peach and mint
 * are surfaces, never buttons.
 */
export function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = "primary",
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "peach" | "outline";
  accessibilityLabel?: string;
}) {
  const c = useColors();
  const isPrimary = variant === "primary";
  const isPeach = variant === "peach";

  const background = isPrimary ? c.primary : isPeach ? c.peach : "transparent";
  const foreground = isPrimary ? c.onPrimary : isPeach ? c.onPeach : c.text;
  const border = isPrimary || isPeach ? "transparent" : c.border;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: background, borderColor: border },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={foreground} /> : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: Cabinet.actionHeight,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.heading,
  },
});
