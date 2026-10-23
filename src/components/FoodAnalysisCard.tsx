import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import { useLanguage } from "@/i18n";
import type { FoodAnalysis } from "@/lib/ai/types";

function Section({ title, items }: { title: string; items: string[] }) {
  const c = useColors();
  const { isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isUrdu && styles.urdu]}>{title}</Text>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={[styles.bulletText, isUrdu && styles.urdu]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** The structured food card rendered inside an assistant message. */
export function FoodAnalysisCard({ food }: { food: FoodAnalysis }) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);

  const badge =
    food.verdict === "good"
      ? { bg: c.accent, fg: c.onAccent, label: t("food.good") }
      : food.verdict === "avoid"
        ? { bg: c.surfaceSelected, fg: c.danger, label: t("food.avoid") }
        : { bg: c.warningSurface, fg: c.warningText, label: t("food.moderate") };

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.fg }]}>
          {badge.label}
        </Text>
      </View>

      <Text style={[styles.headline, isUrdu && styles.urdu]}>
        {food.headline}
      </Text>

      <Section title={t("food.why")} items={food.reasons} />
      <Section title={t("food.watchOut")} items={food.concerns} />

      {food.swaps.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isUrdu && styles.urdu]}>
            {t("food.swaps")}
          </Text>
          {food.swaps.map((swap, index) => (
            <View key={`${swap.from}-${index}`} style={styles.swap}>
              <Text style={[styles.swapLine, isUrdu && styles.urdu]}>
                {swap.from} → {swap.to}
              </Text>
              {swap.why ? (
                <Text style={[styles.swapWhy, isUrdu && styles.urdu]}>
                  {swap.why}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {food.portion_note ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isUrdu && styles.urdu]}>
            {t("food.portion")}
          </Text>
          <Text style={[styles.bulletText, isUrdu && styles.urdu]}>
            {food.portion_note}
          </Text>
        </View>
      ) : null}

      {food.urdu_summary ? (
        <Text style={[styles.urduSummary, styles.urdu]}>
          {food.urdu_summary}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.confidence}>
          {Math.round(food.confidence * 100)}%
        </Text>
        {food.confidence < 0.6 ? (
          <Text style={[styles.low, isUrdu && styles.urdu]}>
            {t("food.lowConfidence")}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.disclaimer, isUrdu && styles.urdu]}>
        {t("assistant.disclaimer")}
      </Text>
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 14,
      gap: 10,
      marginTop: 8,
    },
    badge: {
      alignSelf: "flex-start",
      borderRadius: Radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    badgeText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
    },
    headline: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 23,
    },
    section: { gap: 4 },
    sectionTitle: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    bulletRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    bullet: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      lineHeight: 22,
    },
    bulletText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 22,
    },
    swap: { gap: 1, marginTop: 2 },
    swapLine: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 22,
    },
    swapWhy: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      lineHeight: 19,
    },
    urduSummary: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 28,
      backgroundColor: c.surfaceSelected,
      borderRadius: Radii.md,
      padding: 10,
    },
    footer: { flexDirection: "row", alignItems: "center", gap: 8 },
    confidence: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    low: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.warningText,
    },
    disclaimer: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      lineHeight: 17,
    },
    urdu: { textAlign: "right", writingDirection: "rtl" },
  });
