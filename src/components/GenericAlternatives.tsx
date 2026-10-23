import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import { useLanguage } from "@/i18n";
import {
  findGeneric,
  formatRupees,
  summarizeSavings,
} from "@/data/generics";

/** One medicine's cheaper same-salt option. Renders nothing when unmatched. */
export function GenericAlternatives({
  name,
  activeIngredient,
}: {
  name: string;
  activeIngredient?: string | null;
}) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);
  const match = useMemo(
    () => findGeneric(name, activeIngredient),
    [name, activeIngredient],
  );

  if (!match) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, isUrdu && styles.urdu]}>
        {t("review.generic")}
      </Text>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {match.entry.genericName} {match.entry.strength}
        </Text>
        <Text style={styles.price}>{formatRupees(match.entry.genericPrice)}</Text>
      </View>
      <Text style={styles.saving}>
        {t("review.saveAmount")} {formatRupees(match.saving)} ({match.percent}%)
      </Text>
      <Text style={[styles.note, isUrdu && styles.urdu]}>
        {t("review.savingsNote")}
      </Text>
    </View>
  );
}

/** The single big number for the demo: branded total vs generic total. */
export function SavingsTotal({
  items,
}: {
  items: { name: string; activeIngredient?: string | null }[];
}) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);
  const summary = useMemo(() => summarizeSavings(items), [items]);

  if (!summary) return null;

  return (
    <View style={styles.totalCard}>
      <Text style={[styles.totalLabel, isUrdu && styles.urdu]}>
        {t("review.genericTotal")}
      </Text>
      <View style={styles.totalRow}>
        <View style={styles.totalCol}>
          <Text style={styles.totalCaption}>{t("review.branded")}</Text>
          <Text style={styles.totalStrike}>
            {formatRupees(summary.brandedTotal)}
          </Text>
        </View>
        <View style={styles.totalCol}>
          <Text style={styles.totalCaption}>{t("review.genericLabel")}</Text>
          <Text style={styles.totalValue}>
            {formatRupees(summary.genericTotal)}
          </Text>
        </View>
        <View style={styles.totalCol}>
          <Text style={styles.totalCaption}>{t("review.saveAmount")}</Text>
          <Text style={styles.totalSaving}>
            {formatRupees(summary.saving)} · {summary.percent}%
          </Text>
        </View>
      </View>
      <Text style={[styles.note, isUrdu && styles.urdu]}>
        {t("review.savingsNote")}
      </Text>
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    wrap: {
      borderRadius: Radii.md,
      backgroundColor: c.surfaceSelected,
      padding: 10,
      gap: 2,
      marginTop: 4,
    },
    label: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
    },
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8,
    },
    name: {
      flex: 1,
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.text,
    },
    price: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.body,
      color: c.primary,
      fontVariant: ["tabular-nums"],
    },
    saving: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      color: c.successText,
      fontVariant: ["tabular-nums"],
    },
    note: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      marginTop: 2,
    },
    totalCard: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.accent,
      padding: 16,
      gap: 8,
      marginTop: 16,
    },
    totalLabel: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.onAccent,
    },
    totalRow: { flexDirection: "row", gap: 12 },
    totalCol: { flex: 1, gap: 2 },
    totalCaption: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.onAccent,
      opacity: 0.8,
    },
    totalStrike: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
      color: c.onAccent,
      textDecorationLine: "line-through",
      fontVariant: ["tabular-nums"],
    },
    totalValue: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.heading,
      color: c.onAccent,
      fontVariant: ["tabular-nums"],
    },
    totalSaving: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.label,
      color: c.successText,
      fontVariant: ["tabular-nums"],
    },
    urdu: { textAlign: "right", writingDirection: "rtl" },
  });
