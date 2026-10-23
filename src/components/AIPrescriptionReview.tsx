import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import {
  ExtractedMedicine,
  ExtractionLanguage,
  PrescriptionExtractionResult,
} from "@/lib/ai/prescription-types";

export interface AIPrescriptionReviewProps {
  visible: boolean;
  result: PrescriptionExtractionResult | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onApply: (data: {
    doctorName?: string | null;
    visitDate?: string | null;
    diagnosis?: string | null;
    medicines: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    notes?: string;
  }) => void;
  onRetakeOrSelectOther?: () => void;
  /** Override the footer CTA (e.g. "Done" on the record detail screen). */
  applyLabel?: string;
}

export function AIPrescriptionReview({
  visible,
  result,
  loading,
  error,
  onClose,
  onApply,
  onRetakeOrSelectOther,
  applyLabel,
}: AIPrescriptionReviewProps) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [selectedLanguage, setSelectedLanguage] = useState<ExtractionLanguage>(
    result?.language || "ur",
  );

  if (!visible) return null;

  const localizedSummary =
    selectedLanguage === "ur"
      ? result?.summary_explanation_ur ?? result?.summary_explanation
      : selectedLanguage === "sd"
        ? result?.summary_explanation_sd ?? result?.summary_explanation
        : result?.summary_explanation_en ?? result?.summary_explanation;

  const handleApply = () => {
    if (!result) return;

    const medicines = result.medicines.map((m) => {
      const name = m.normalized_name || m.name_as_written || "";
      const dosage = [m.strength, m.dosage_as_written]
        .filter(Boolean)
        .join(" ")
        .trim();
      const frequency = [m.frequency_as_written, m.meal_instruction_as_written]
        .filter(Boolean)
        .join(" - ")
        .trim();
      const duration = m.duration_as_written || "";

      return {
        name,
        dosage,
        frequency,
        duration,
      };
    });

    // Construct AI notes with warnings and multilingual summary
    const notesParts: string[] = [];
    if (localizedSummary) {
      notesParts.push(`AI Note (${selectedLanguage}): ${localizedSummary}`);
    }
    if (result.general_warnings.length > 0) {
      notesParts.push(`Warnings: ${result.general_warnings.join("; ")}`);
    }
    if (result.unreadable_text.length > 0) {
      notesParts.push(`Unreadable sections: ${result.unreadable_text.join(", ")}`);
    }

    onApply({
      doctorName: result.doctor_name,
      visitDate: result.visit_date,
      diagnosis: result.diagnosis_or_symptoms,
      medicines,
      notes: notesParts.join("\n\n"),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Icon name="x" size={24} color={c.text} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>ParchiiAI Review</Text>
            <Text style={styles.headerSubtitle}>Prescription Intelligence</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Loading state */}
          {loading && (
            <View style={styles.cardCenter}>
              <Icon name="pill-fill" size={40} color={c.primary} />
              <Text style={styles.loadingTitle}>Reading prescription...</Text>
              <Text style={styles.loadingSubtitle}>
                Analyzing handwriting, verifying medicines, and preparing caregiver instructions.
              </Text>
            </View>
          )}

          {/* Error state */}
          {!loading && error && (
            <View style={[styles.card, styles.errorCard]}>
              <Text style={styles.errorHeading}>Analysis Notice</Text>
              <Text style={styles.errorBody}>{error}</Text>
              {onRetakeOrSelectOther && (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={onRetakeOrSelectOther}
                >
                  <Text style={styles.secondaryBtnText}>Try another photo</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Result view */}
          {!loading && result && (
            <>
              {/* Language Selector */}
              <View style={styles.langRow}>
                <Text style={styles.langLabel}>Explanation:</Text>
                {(
                  [
                    ["ur", "اردو"],
                    ["sd", "سنڌي"],
                    ["en", "English"],
                  ] as const
                ).map(([code, label]) => (
                  <Pressable
                    key={code}
                    style={[
                      styles.langChip,
                      selectedLanguage === code && styles.langChipActive,
                    ]}
                    onPress={() => setSelectedLanguage(code)}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        selectedLanguage === code && styles.langChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Status Banner */}
              {result.requires_human_review ? (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningTitle}>
                    ⚠️ Human Verification Required
                  </Text>
                  <Text style={styles.warningText}>
                    Some handwritten names or dosages are ambiguous. Confirm with
                    your pharmacist before administering medication.
                  </Text>
                </View>
              ) : (
                <View style={styles.successBanner}>
                  <Text style={styles.successTitle}>
                    ✓ Extraction Complete
                  </Text>
                  <Text style={styles.successText}>
                    Prescription items were transcribed with high clarity.
                  </Text>
                </View>
              )}

              {/* Clinical summary explanation */}
              {localizedSummary && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    {selectedLanguage === "ur"
                      ? "ہدایات برائے تیماردار"
                      : selectedLanguage === "sd"
                      ? "تيماردار لاءِ هدايتون"
                      : "Caregiver Instructions"}
                  </Text>
                  <Text style={styles.summaryBody}>
                    {localizedSummary}
                  </Text>
                </View>
              )}

              {/* Doctor & Visit Meta Card */}
              {(result.doctor_name || result.visit_date || result.diagnosis_or_symptoms) && (
                <View style={styles.card}>
                  <Text style={styles.sectionHeading}>Visit Details</Text>
                  {result.doctor_name && (
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Doctor: </Text>
                      <Text style={styles.metaVal}>{result.doctor_name}</Text>
                    </Text>
                  )}
                  {result.visit_date && (
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Date: </Text>
                      <Text style={styles.metaVal}>{result.visit_date}</Text>
                    </Text>
                  )}
                  {result.diagnosis_or_symptoms && (
                    <Text style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Diagnosis / Note: </Text>
                      <Text style={styles.metaVal}>{result.diagnosis_or_symptoms}</Text>
                    </Text>
                  )}
                </View>
              )}

              {/* Medicines List */}
              <Text style={styles.sectionHeading}>
                Extracted Medicines ({result.medicines.length})
              </Text>

              {result.medicines.map((m, index) => (
                <MedicineReviewItem
                  key={index}
                  medicine={m}
                  language={selectedLanguage}
                  c={c}
                  styles={styles}
                />
              ))}

              {/* Unreadable segments */}
              {result.unreadable_text.length > 0 && (
                <View style={styles.unreadableCard}>
                  <Text style={styles.unreadableTitle}>
                    Illegible / Unreadable Sections
                  </Text>
                  {result.unreadable_text.map((text, idx) => (
                    <Text key={idx} style={styles.unreadableItem}>
                      • &quot;{text}&quot;
                    </Text>
                  ))}
                  <Text style={styles.unreadableAdvice}>
                    Please show the original prescription slip to your pharmacist for these lines.
                  </Text>
                </View>
              )}

              {/* Medical safety disclaimer */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer Actions */}
        {!loading && result && (
          <View style={styles.footer}>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Icon name="check-bold" size={20} color={c.surface} />
              <Text style={styles.applyButtonText}>
                {applyLabel ?? "Accept & Apply to Form"}
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function MedicineReviewItem({
  medicine: m,
  language,
  c,
  styles,
}: {
  medicine: ExtractedMedicine;
  language: ExtractionLanguage;
  c: ThemePalette;
  styles: any;
}) {
  const medicineName = m.normalized_name || m.name_as_written || "Unknown medicine";
  const confidenceColor =
    m.confidence === "high"
      ? c.success
      : m.confidence === "medium"
      ? c.warningText
      : c.danger;

  const localizedExplanation =
    language === "ur"
      ? m.explanation_ur
      : language === "sd"
      ? m.explanation_sd
      : m.explanation_en;

  return (
    <View style={styles.medicineCard}>
      <View style={styles.medHeadRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{medicineName}</Text>
          {m.name_as_written && m.normalized_name && m.name_as_written !== m.normalized_name && (
            <Text style={styles.medWritten}>
              Written as: &quot;{m.name_as_written}&quot;
            </Text>
          )}
          {m.active_ingredient && (
            <Text style={styles.medGeneric}>
              Generic: {m.active_ingredient}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.confidencePill,
            { borderColor: confidenceColor, backgroundColor: c.surface },
          ]}
        >
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {m.confidence.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Wells for dosage and timing */}
      <View style={styles.wellsRow}>
        <View style={styles.well}>
          <Text style={styles.wellLabel}>Strength/Dose</Text>
          <Text style={styles.wellVal}>
            {[m.strength, m.dosage_as_written].filter(Boolean).join(" ") || "—"}
          </Text>
        </View>
        <View style={styles.well}>
          <Text style={styles.wellLabel}>Frequency</Text>
          <Text style={styles.wellVal}>{m.frequency_as_written || "—"}</Text>
        </View>
        <View style={styles.well}>
          <Text style={styles.wellLabel}>Duration</Text>
          <Text style={styles.wellVal}>{m.duration_as_written || "—"}</Text>
        </View>
      </View>

      {/* Meal instruction */}
      {m.meal_instruction_as_written && (
        <View style={styles.tagRow}>
          <Text style={styles.mealTag}>
            🍴 {m.meal_instruction_as_written}
          </Text>
        </View>
      )}

      {/* Purpose note */}
      {m.purpose && (
        <Text style={styles.purposeText}>
          General purpose: {m.purpose}
        </Text>
      )}

      {/* Pharmacist check notice */}
      {m.needs_pharmacist_confirmation && (
        <View style={styles.pharmacistAlert}>
          <Text style={styles.pharmacistAlertText}>
            ⚠️ Verify dosage with pharmacist ({m.uncertain_fields.join(", ") || "handwriting check"})
          </Text>
        </View>
      )}

      {/* Localized caregiver instructions */}
      {localizedExplanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{localizedExplanation}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    iconBtn: {
      padding: 6,
    },
    titleWrap: {
      alignItems: "center",
    },
    headerTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.text,
    },
    headerSubtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    cardCenter: {
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      backgroundColor: c.surface,
      borderRadius: Cabinet.cardRadius,
      marginTop: 24,
    },
    loadingTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.text,
      marginTop: 16,
    },
    loadingSubtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: Cabinet.cardRadius,
      padding: 16,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    errorCard: {
      borderColor: c.danger,
      backgroundColor: c.warningSurface,
    },
    errorHeading: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.danger,
      marginBottom: 8,
    },
    errorBody: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 20,
    },
    secondaryBtn: {
      marginTop: 12,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: Radii.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    secondaryBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.text,
    },
    langRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
      gap: 8,
    },
    langLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    langChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Radii.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    langChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    langChipText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.text,
    },
    langChipTextActive: {
      color: c.onPrimary,
    },
    warningBanner: {
      backgroundColor: c.warningSurface,
      borderRadius: Cabinet.cardRadius,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    warningTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.body,
      color: c.warningText,
      marginBottom: 4,
    },
    warningText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.warningText,
      lineHeight: 18,
    },
    successBanner: {
      backgroundColor: c.accent,
      borderRadius: Cabinet.cardRadius,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    successTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.body,
      color: c.onAccent,
      marginBottom: 4,
    },
    successText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.onAccent,
    },
    summaryCard: {
      backgroundColor: c.surface,
      borderRadius: Cabinet.cardRadius,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    summaryTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.text,
      marginBottom: 6,
    },
    summaryBody: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 22,
    },
    sectionHeading: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.text,
      marginBottom: 10,
      marginTop: 6,
    },
    metaRow: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      marginBottom: 4,
    },
    metaLabel: {
      color: c.textSecondary,
    },
    metaVal: {
      color: c.text,
      fontFamily: Fonts.bodyMedium,
    },
    medicineCard: {
      backgroundColor: c.surface,
      borderRadius: Cabinet.cardRadius,
      padding: 14,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    medHeadRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    medName: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.text,
    },
    medWritten: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      marginTop: 2,
    },
    medGeneric: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.primary,
      marginTop: 2,
    },
    confidencePill: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: Radii.pill,
      borderWidth: 1,
    },
    confidenceText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      fontWeight: "700",
    },
    wellsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    well: {
      flex: 1,
      backgroundColor: c.background,
      borderRadius: Radii.lg,
      padding: 8,
    },
    wellLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      marginBottom: 2,
    },
    wellVal: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.label,
      color: c.text,
    },
    tagRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    mealTag: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      color: c.text,
      backgroundColor: c.surfaceSelected,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: Radii.pill,
    },
    purposeText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      marginBottom: 6,
    },
    pharmacistAlert: {
      backgroundColor: c.warningSurface,
      borderRadius: Radii.lg,
      padding: 8,
      marginTop: 6,
    },
    pharmacistAlertText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      color: c.warningText,
    },
    explanationBox: {
      backgroundColor: c.background,
      borderRadius: Radii.lg,
      padding: 10,
      marginTop: 8,
    },
    explanationText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.text,
      lineHeight: 18,
    },
    unreadableCard: {
      backgroundColor: c.warningSurface,
      borderRadius: Cabinet.cardRadius,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    unreadableTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.body,
      color: c.warningText,
      marginBottom: 6,
    },
    unreadableItem: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.text,
      marginBottom: 2,
    },
    unreadableAdvice: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.caption,
      color: c.warningText,
      marginTop: 6,
    },
    disclaimerBox: {
      padding: 12,
      borderRadius: Cabinet.cardRadius,
      backgroundColor: c.surfaceSelected,
      marginTop: 10,
    },
    disclaimerText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      lineHeight: 16,
      textAlign: "center",
    },
    footer: {
      padding: 16,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    applyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: Radii.xl,
      gap: 8,
    },
    applyButtonText: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.heading,
      color: c.onPrimary,
    },
  });
