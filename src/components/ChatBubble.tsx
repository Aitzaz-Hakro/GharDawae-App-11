import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import { Icon } from "@/components/Icon";
import { MedicineChip, type MedicineRecord } from "@/components/Cabinet";
import { FoodAnalysisCard } from "@/components/FoodAnalysisCard";
import { useLanguage } from "@/i18n";
import type {
  ChatMessage,
  PrescriptionExtraction,
} from "@/lib/ai/types";

type Props = {
  message: ChatMessage;
  onReviewPrescription?: (
    imageUri: string,
    extraction: PrescriptionExtraction,
  ) => void;
  onRetry?: () => void;
};

export function ChatBubble({
  message,
  onReviewPrescription,
  onRetry,
}: Props) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (message.role === "user") {
    return (
      <View style={styles.userWrap}>
        {message.imageUri ? (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.userImage}
            contentFit="cover"
            accessibilityLabel={message.imageKind === "food" ? t("assistant.foodPhoto") : t("assistant.prescriptionPhoto")}
          />
        ) : null}
        {message.text.trim() ? (
          <View style={styles.userBubble}>
            <Text style={[styles.userText, isUrdu && styles.urdu]}>
              {message.text}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (message.status === "sending") {
    return (
      <View style={styles.thinking}>
        <ActivityIndicator size="small" color={c.primary} />
        <Text style={[styles.thinkingText, isUrdu && styles.urdu]}>
          {t("assistant.thinking")}
        </Text>
      </View>
    );
  }

  if (message.status === "error") {
    return (
      <View style={styles.errorBubble}>
        <Icon name="warning-circle" size={18} color={c.warningText} />
        <View style={styles.errorBody}>
          <Text style={[styles.errorText, isUrdu && styles.urdu]}>
            {message.error ?? t("assistant.failed")}
          </Text>
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

  const reply = message.reply;
  if (!reply) return null;

  return (
    <View style={styles.assistantWrap}>
      {reply.text.trim() ? (
        <View style={styles.assistantBubble}>
          <Text style={[styles.assistantText, isUrdu && styles.urdu]}>
            {reply.text}
          </Text>
        </View>
      ) : null}

      {reply.kind === "text" ? null : reply.kind === "food" ? (
        <FoodAnalysisCard food={reply.food} />
      ) : (
        <PrescriptionCard
          extraction={reply.prescription}
          imageUri={message.imageUri}
          onReview={onReviewPrescription}
        />
      )}
    </View>
  );
}

function PrescriptionCard({
  extraction,
  imageUri,
  onReview,
}: {
  extraction: PrescriptionExtraction;
  imageUri?: string;
  onReview?: (imageUri: string, extraction: PrescriptionExtraction) => void;
}) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);

  const medicines: MedicineRecord[] = extraction.medicines.map((m, index) => ({
    id: `${index}`,
    name: m.name,
    dosage: m.strength ?? m.dosage,
    frequency: m.frequency,
    duration: m.duration,
  }));

  return (
    <View style={styles.rxCard}>
      <View style={styles.rxHead}>
        <Icon name="pill-fill" size={18} color={c.primary} />
        <Text style={styles.rxTitle} numberOfLines={1}>
          {extraction.doctor_name ?? t("assistant.prescriptionPhoto")}
        </Text>
        <Text style={styles.rxConfidence}>
          {Math.round(extraction.overall_confidence * 100)}%
        </Text>
      </View>

      {extraction.visit_date ? (
        <Text style={styles.rxMeta}>{extraction.visit_date}</Text>
      ) : null}

      <View style={styles.chips}>
        {medicines.map((medicine) => (
          <MedicineChip key={medicine.id} medicine={medicine} />
        ))}
      </View>

      {extraction.warnings.length > 0 ? (
        <Text style={[styles.rxWarning, isUrdu && styles.urdu]}>
          {extraction.warnings[0]}
        </Text>
      ) : null}

      {imageUri && onReview ? (
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          onPress={() => onReview(imageUri, extraction)}
          accessibilityRole="button"
          accessibilityLabel={t("assistant.reviewAndSave")}
        >
          <Text style={styles.ctaText}>{t("assistant.reviewAndSave")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    userWrap: {
      alignSelf: "flex-end",
      maxWidth: "88%",
      alignItems: "flex-end",
      gap: 6,
    },
    userBubble: {
      backgroundColor: c.primary,
      borderRadius: Radii.lg,
      borderBottomRightRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.onPrimary,
      lineHeight: 22,
    },
    userImage: {
      width: 190,
      height: 190,
      borderRadius: Cabinet.blockRadius,
      backgroundColor: c.surfaceSelected,
    },
    assistantWrap: { alignSelf: "stretch", gap: 6 },
    assistantBubble: {
      alignSelf: "flex-start",
      maxWidth: "92%",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radii.lg,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    assistantText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 23,
    },
    thinking: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },
    thinkingText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    errorBubble: {
      alignSelf: "flex-start",
      maxWidth: "92%",
      flexDirection: "row",
      gap: 10,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.warningText,
      backgroundColor: c.warningSurface,
      padding: 12,
    },
    errorBody: { flex: 1, gap: 2 },
    errorText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.warningText,
      lineHeight: 20,
    },
    retry: { paddingVertical: 6, minHeight: 32 },
    retryText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.warningText,
      textDecorationLine: "underline",
    },
    rxCard: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 14,
      gap: 8,
    },
    rxHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    rxTitle: {
      flex: 1,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
    },
    rxConfidence: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    rxMeta: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    rxWarning: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.warningText,
      lineHeight: 20,
    },
    cta: {
      minHeight: Cabinet.actionHeight,
      borderRadius: Radii.xl,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    ctaText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.onPrimary,
    },
    pressed: { opacity: 0.85 },
    urdu: { textAlign: "right", writingDirection: "rtl", lineHeight: 26 },
  });
