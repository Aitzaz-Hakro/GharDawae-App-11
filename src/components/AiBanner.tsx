import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts } from "@/constants/theme";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/i18n";
import type { AIErrorCode, PrescriptionExtraction } from "@/lib/ai/types";

export type AiStatus = "idle" | "loading" | "done" | "error";

type Props = {
  status: AiStatus;
  extraction?: PrescriptionExtraction | null;
  error?: string | null;
  errorCode?: AIErrorCode | null;
  elapsedMs?: number | null;
  onRetry?: () => void;
};

/** The state line above the review form: reading, read, or failed. */
export function AiBanner({
  status,
  extraction,
  error,
  errorCode,
  elapsedMs,
  onRetry,
}: Props) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={c.primary} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, isUrdu && styles.urdu]}>
            {t("review.reading")}
          </Text>
          <Text style={[styles.body, isUrdu && styles.urdu]}>
            {t("review.consent")}
          </Text>
        </View>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Icon name="warning-circle" size={22} color={c.warningText} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, styles.errorTitle, isUrdu && styles.urdu]}>
            {errorCode === "not_configured"
              ? t("review.notConfigured")
              : t("review.failed")}
          </Text>
          {error ? (
            <Text style={[styles.body, isUrdu && styles.urdu]}>{error}</Text>
          ) : null}
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              style={styles.retry}
              accessibilityRole="button"
              accessibilityLabel={t("common.retry")}
            >
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  const confidence = extraction?.overall_confidence ?? 0;
  const low = confidence < 0.7;
  const count = extraction?.medicines.length ?? 0;

  return (
    <View style={[styles.card, low ? styles.lowCard : styles.doneCard]}>
      <Icon
        name={low ? "warning-circle" : "sparkle"}
        size={22}
        color={low ? c.warningText : c.primary}
      />
      <View style={styles.textWrap}>
        <Text style={[styles.title, isUrdu && styles.urdu]}>
          {t("review.read")}
        </Text>
        <Text style={[styles.meta, isUrdu && styles.urdu]}>
          {count} {t("review.medicinesFound")}
          {elapsedMs ? ` · ${(elapsedMs / 1000).toFixed(1)}s` : ""}
          {` · ${Math.round(confidence * 100)}%`}
        </Text>
        {low ? (
          <Text style={[styles.lowText, isUrdu && styles.urdu]}>
            {t("review.lowConfidence")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      padding: 14,
      marginTop: 12,
    },
    loadingCard: {
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    doneCard: {
      borderColor: c.border,
      backgroundColor: c.accent,
    },
    lowCard: {
      borderColor: c.warningText,
      backgroundColor: c.warningSurface,
    },
    errorCard: {
      borderColor: c.warningText,
      backgroundColor: c.warningSurface,
    },
    textWrap: { flex: 1, gap: 2 },
    title: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
    },
    errorTitle: { color: c.warningText },
    body: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      lineHeight: 20,
    },
    meta: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    lowText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.warningText,
      marginTop: 2,
    },
    retry: { alignSelf: "flex-start", paddingVertical: 8, minHeight: 40 },
    retryText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.warningText,
      textDecorationLine: "underline",
    },
    urdu: {
      textAlign: "right",
      writingDirection: "rtl",
      lineHeight: 24,
    },
  });
