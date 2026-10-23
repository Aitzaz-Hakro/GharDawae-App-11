import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Fonts, FontSizes, Radii } from "@/constants/theme";
import { useLanguage, type Lang } from "@/i18n";

/** Two-segment EN / اردو switch. Used in the home header and settings. */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c, compact), [c, compact]);

  const options: { value: Lang; label: string; a11y: string }[] = [
    { value: "en", label: "EN", a11y: "English" },
    { value: "ur", label: "اردو", a11y: "Urdu" },
  ];

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = lang === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.item, active && styles.active]}
            onPress={() => setLang(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.a11y}
          >
            <Text style={[styles.text, active && styles.activeText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemePalette, compact: boolean) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      padding: 3,
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    item: {
      minHeight: compact ? 34 : 40,
      paddingHorizontal: compact ? 10 : 14,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: Radii.pill,
    },
    active: { backgroundColor: c.primary },
    text: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    activeText: { color: c.onPrimary, fontFamily: Fonts.headingSemi },
  });
