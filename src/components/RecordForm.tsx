import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { CameraCapture } from "@/components/CameraCapture";
import { AIPrescriptionReview } from "@/components/AIPrescriptionReview";
import { KeyboardAwareScroll } from "@/components/ui/KeyboardAwareScroll";
import { Icon } from "@/components/Icon";
import { AiBanner, type AiStatus } from "@/components/AiBanner";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import {
  GenericAlternatives,
  SavingsTotal,
} from "@/components/GenericAlternatives";
import { useLanguage } from "@/i18n";
import {
  addPrescription,
  formatDateInput,
  formatVisitDate,
  medicineSuggestions,
  parseDateInput,
  recentDoctors,
  today,
} from "@/lib/records";
import { savePhoto } from "@/lib/photo";
import { uuid } from "@/lib/uuid";
import { analyzePrescriptionImage } from "@/lib/ai/service";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";
import type {
  AIErrorCode,
  ExtractedMedicine,
  PrescriptionExtraction,
} from "@/lib/ai/types";
import type { PrescriptionExtractionResult } from "@/lib/ai/prescription-types";

type MedicineDraft = {
  /** Local-only key so editing a row doesn't remount the inputs. */
  key: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

function emptyMedicine(): MedicineDraft {
  return { key: uuid(), name: "", dosage: "", frequency: "", duration: "" };
}

function findExtracted(
  extraction: PrescriptionExtraction | null | undefined,
  typedName: string,
): ExtractedMedicine | null {
  const key = typedName.trim().toLowerCase();
  if (!key) return null;
  return (
    extraction?.medicines.find((m) => key.startsWith(m.name.toLowerCase())) ??
    null
  );
}

export type RecordFormProps = {
  memberId: string;
  familyId: string;
  /** Photo already parked in cache by the camera screen, if any. */
  initialPhotoUri?: string;
  onSaved: () => void;
  /** AI prefill + review state. Omit for a purely manual record. */
  extraction?: PrescriptionExtraction | null;
  aiStatus?: AiStatus;
  aiError?: string | null;
  aiErrorCode?: AIErrorCode | null;
  aiElapsedMs?: number | null;
  onRetryAi?: () => void;
};

/**
 * The add-record form. Shared by the standalone "Add record" screen and the
 * camera flow, which pushes straight here after a capture so the shot isn't
 * lost if the user backs out of the form.
 *
 * The AI never saves anything: it only pre-fills this form, and the user must
 * press Save. That is the safety boundary.
 */
export function RecordForm({
  memberId,
  familyId,
  initialPhotoUri,
  onSaved,
  extraction = null,
  aiStatus = "idle",
  aiError = null,
  aiErrorCode = null,
  aiElapsedMs = null,
  onRetryAi,
}: RecordFormProps) {
  const router = useRouter();
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);
  const appliedRef = useRef(false);

  const [photoUri, setPhotoUri] = useState<string | null>(initialPhotoUri ?? null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [visitDate, setVisitDate] = useState(today());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineDraft[]>([emptyMedicine()]);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [parchiiOpen, setParchiiOpen] = useState(false);
  const [parchiiLoading, setParchiiLoading] = useState(false);
  const [parchiiResult, setParchiiResult] =
    useState<PrescriptionExtractionResult | null>(null);
  const [parchiiError, setParchiiError] = useState<string | null>(null);

  // One-time prop-to-state sync: the extraction arrives asynchronously and
  // must fill the form exactly once. appliedRef prevents cascading renders, so
  // the usual set-state-in-effect warning does not apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!extraction || appliedRef.current) return;
    appliedRef.current = true;

    const aiNotes = [
      extraction.urdu_summary ? `AI summary:\n${extraction.urdu_summary}` : "",
      extraction.warnings.length > 0
        ? `Warnings:\n${extraction.warnings.map((w) => `- ${w}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    setDoctorName((prev) => prev.trim() || extraction.doctor_name || "");
    setDiagnosis((prev) => prev.trim() || extraction.diagnosis || "");
    setNotes((prev) => prev.trim() || aiNotes);
    if (extraction.visit_date) {
      setVisitDate((prev) =>
        prev === today() ? extraction.visit_date ?? prev : prev,
      );
    }

    const rows: MedicineDraft[] = extraction.medicines.map((m) => ({
      key: uuid(),
      name: [m.name, m.strength].filter(Boolean).join(" "),
      dosage: m.dosage ?? "",
      frequency: m.frequency ?? "",
      duration: m.duration ?? "",
    }));

    setMedicines((prev) =>
      prev.some((m) => m.name.trim().length > 0) || rows.length === 0
        ? prev
        : rows,
    );
  }, [extraction]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fast entry: remember doctors this member has seen before.
  useEffect(() => {
    let alive = true;
    recentDoctors(memberId)
      .then((names) => {
        if (alive) setDoctors(names);
      })
      .catch(() => {
        // Suggestions are a nice-to-have; never block the form on them.
      });
    return () => {
      alive = false;
    };
  }, [memberId]);

  // Medicine autocomplete from what this family has typed before. The results
  // are stored alongside the query they belong to, so a slow response for an
  // earlier keystroke can never show up under a newer one.
  const activeName = useMemo(
    () => medicines[medicines.length - 1]?.name.trim() ?? "",
    [medicines],
  );
  const [matches, setMatches] = useState<{ query: string; names: string[] }>({
    query: "",
    names: [],
  });
  useEffect(() => {
    if (activeName.length < 2) return;
    let alive = true;
    const timer = setTimeout(() => {
      medicineSuggestions(familyId, activeName)
        .then((names) => {
          if (alive) setMatches({ query: activeName, names });
        })
        .catch(() => {
          if (alive) setMatches({ query: activeName, names: [] });
        });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [activeName, familyId]);
  const suggestions =
    activeName.length >= 2 && matches.query === activeName ? matches.names : [];

  const savingsItems = useMemo(
    () =>
      (extraction?.medicines ?? []).map((m) => ({
        name: m.name,
        activeIngredient: m.active_ingredient,
      })),
    [extraction],
  );

  function patchMedicine(key: string, patch: Partial<MedicineDraft>) {
    setMedicines((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeMedicine(key: string) {
    setMedicines((rows) => rows.filter((r) => r.key !== key));
  }

  /**
   * The ParchiiAI path is deliberately manual: it reads the photo the
   * caretaker already attached and opens a review drawer. It never saves.
   * The automatic assistant extraction (main's AiBanner) is independent.
   */
  async function onAnalyzeWithParchii() {
    if (!photoUri) {
      Alert.alert(
        t("record.nothingTitle"),
        "Add a photo of the prescription first.",
      );
      return;
    }
    setParchiiLoading(true);
    setParchiiError(null);
    setParchiiOpen(true);
    try {
      const result = await analyzePrescriptionImage({
        imageUri: photoUri,
        language: "ur",
      });
      setParchiiResult(result);
    } catch (e) {
      const error = e as Error & { userFacingMessage?: { en?: string } };
      setParchiiError(
        error.userFacingMessage?.en ||
          error.message ||
          "Failed to analyze the prescription.",
      );
    } finally {
      setParchiiLoading(false);
    }
  }

  function onApplyParchiiResult(data: {
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
  }) {
    if (data.doctorName && !doctorName.trim()) setDoctorName(data.doctorName);
    if (data.visitDate) setVisitDate(data.visitDate);
    if (data.diagnosis && !diagnosis.trim()) setDiagnosis(data.diagnosis);
    if (data.medicines.length > 0) {
      const existingFilled = medicines.filter((m) => m.name.trim());
      const newMeds = data.medicines.map((m) => ({
        key: uuid(),
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
      }));
      setMedicines(
        existingFilled.length === 0 ? newMeds : [...existingFilled, ...newMeds],
      );
    }
    if (data.notes) {
      setNotes((prev) =>
        prev ? `${prev}\n\n${data.notes}` : (data.notes ?? ""),
      );
    }
  }

  async function onSave() {
    const filled = medicines.filter((m) => m.name.trim());
    // Phase 6 rule: a record needs a photo or at least one medicine.
    if (!photoUri && filled.length === 0) {
      Alert.alert(t("record.nothingTitle"), t("record.nothingBody"));
      return;
    }

    setBusy(true);
    try {
      // Name the photo after its record so the two can never drift apart.
      const id = uuid();
      const photoPath = photoUri ? await savePhoto(photoUri, id) : null;

      await addPrescription({
        id,
        member_id: memberId,
        photo_path: photoPath,
        doctor_name: doctorName.trim() || null,
        visit_date: visitDate,
        diagnosis_note: diagnosis.trim() || null,
        notes: notes.trim() || null,
        medicines: filled.map((m) => ({
          name: m.name,
          dosage: m.dosage.trim() || null,
          frequency: m.frequency.trim() || null,
          duration: m.duration.trim() || null,
        })),
      });
      onSaved();
    } catch (e) {
      Alert.alert(t("record.couldNotSave"), (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const lastKey = medicines[medicines.length - 1]?.key;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{ headerShown: true, title: t("member.newRecord") }}
      />
      <KeyboardAwareScroll contentContainerStyle={styles.content}>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
              <View style={styles.photoActions}>
                <Pressable onPress={() => setCameraOpen(true)}>
                  <Text style={styles.link}>{t("record.retake")}</Text>
                </Pressable>
                <Pressable onPress={() => setPhotoUri(null)}>
                  <Text style={styles.linkDanger}>{t("record.removePhoto")}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.photoPlaceholder}
              onPress={() => setCameraOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t("record.photograph")}
            >
              <Icon name="camera" size={34} color={c.textSecondary} />
              <Text style={styles.photoPlaceholderText}>
                {t("record.photograph")}
              </Text>
            </Pressable>
          )}

          {photoUri ? (
            <Pressable
              style={[
                styles.aiAnalyzeBtn,
                parchiiLoading && styles.aiAnalyzeBtnDisabled,
              ]}
              onPress={onAnalyzeWithParchii}
              disabled={parchiiLoading}
              accessibilityRole="button"
              accessibilityLabel="Analyze this prescription with ParchiiAI"
            >
              <Icon name="pill-fill" size={18} color={c.onPrimary} />
              <Text style={styles.aiAnalyzeBtnText}>
                {parchiiLoading
                  ? "Reading with ParchiiAI..."
                  : "Analyze with ParchiiAI"}
              </Text>
            </Pressable>
          ) : null}

          <CameraCapture
            visible={cameraOpen}
            title={t("record.photograph")}
            onClose={() => setCameraOpen(false)}
            onCaptured={(uri) => {
              setPhotoUri(uri);
              setCameraOpen(false);
            }}
          />

          <AIPrescriptionReview
            visible={parchiiOpen}
            result={parchiiResult}
            loading={parchiiLoading}
            error={parchiiError}
            onClose={() => setParchiiOpen(false)}
            onApply={onApplyParchiiResult}
            onRetakeOrSelectOther={() => {
              setParchiiOpen(false);
              setCameraOpen(true);
            }}
          />

          <AiBanner
            status={aiStatus}
            extraction={extraction}
            error={aiError}
            errorCode={aiErrorCode}
            elapsedMs={aiElapsedMs}
            onRetry={onRetryAi}
          />

          {extraction && extraction.warnings.length > 0 ? (
            <View style={styles.warningCard}>
              <View style={styles.warningHead}>
                <Icon name="warning-circle" size={20} color={c.warningText} />
                <Text style={[styles.warningTitle, isUrdu && styles.urdu]}>
                  {t("review.warnings")}
                </Text>
              </View>
              {extraction.warnings.map((warning, index) => (
                <View key={`${warning}-${index}`} style={styles.warningRow}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={[styles.warningText, isUrdu && styles.urdu]}>
                    {warning}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {extraction ? (
            <ScheduleGrid medicines={extraction.medicines} />
          ) : null}

          {extraction?.raw_text ? (
            <View style={styles.rawWrap}>
              <Pressable
                onPress={() => setShowRaw((value) => !value)}
                style={styles.rawToggle}
                accessibilityRole="button"
                accessibilityState={{ expanded: showRaw }}
              >
                <Text style={[styles.rawToggleText, isUrdu && styles.urdu]}>
                  {t("review.whatAiRead")}
                </Text>
                <Text style={styles.rawChevron}>{showRaw ? "−" : "+"}</Text>
              </Pressable>
              {showRaw ? (
                <Text style={styles.rawText}>{extraction.raw_text}</Text>
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.label, isUrdu && styles.urdu]}>
            {t("record.doctor")}
          </Text>
          <TextInput
            style={[styles.input, isUrdu && styles.urduInput]}
            placeholder={t("record.doctorPlaceholder")}
            placeholderTextColor={c.textSecondary}
            value={doctorName}
            onChangeText={setDoctorName}
            editable={!busy}
          />
          {doctors.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.chipWrapRow}>
                {doctors.map((d) => (
                  <Pressable
                    key={d}
                    style={styles.chip}
                    onPress={() => setDoctorName(d)}
                  >
                    <Text style={styles.chipText}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          <Text style={[styles.label, isUrdu && styles.urdu]}>
            {t("record.visitDate")}
          </Text>
          {Platform.OS === "web" ? (
            <TextInput
              style={styles.input}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textSecondary}
              editable={!busy}
            />
          ) : (
            <>
              <Pressable
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={busy}
              >
                <Text style={styles.dateText}>{formatVisitDate(visitDate)}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={parseDateInput(visitDate)}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={(_event, date) => {
                    // Android closes the dialog itself and may report no date.
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setVisitDate(formatDateInput(date));
                  }}
                />
              )}
            </>
          )}

          <Text style={[styles.label, isUrdu && styles.urdu]}>
            {t("record.diagnosis")}
          </Text>
          <TextInput
            style={[styles.input, isUrdu && styles.urduInput]}
            placeholder={t("record.diagnosisPlaceholder")}
            placeholderTextColor={c.textSecondary}
            value={diagnosis}
            onChangeText={setDiagnosis}
            editable={!busy}
          />

          <Text style={[styles.label, isUrdu && styles.urdu]}>
            {t("record.medicines")}
          </Text>
          {medicines.map((m) => {
            const aiMedicine = findExtracted(extraction, m.name);
            return (
              <View key={m.key} style={styles.medicineCard}>
                <View style={styles.medicineHead}>
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder={t("record.medicineName")}
                    placeholderTextColor={c.textSecondary}
                    value={m.name}
                    onChangeText={(v) => patchMedicine(m.key, { name: v })}
                    editable={!busy}
                  />
                  {medicines.length > 1 && (
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => removeMedicine(m.key)}
                      hitSlop={8}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Remove this medicine"
                    >
                      <Icon name="x" size={20} color={c.danger} />
                    </Pressable>
                  )}
                </View>

                {aiMedicine && aiMedicine.confidence < 0.7 ? (
                  <View style={styles.lowChip}>
                    <Icon name="warning-circle" size={14} color={c.warningText} />
                    <Text style={styles.lowChipText}>
                      {t("review.checkThis")}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.medicineRow}>
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder={t("record.dosage")}
                    placeholderTextColor={c.textSecondary}
                    value={m.dosage}
                    onChangeText={(v) => patchMedicine(m.key, { dosage: v })}
                    editable={!busy}
                  />
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder={t("record.frequency")}
                    placeholderTextColor={c.textSecondary}
                    value={m.frequency}
                    onChangeText={(v) => patchMedicine(m.key, { frequency: v })}
                    editable={!busy}
                  />
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder={t("record.duration")}
                    placeholderTextColor={c.textSecondary}
                    value={m.duration}
                    onChangeText={(v) => patchMedicine(m.key, { duration: v })}
                    editable={!busy}
                  />
                </View>

                <GenericAlternatives
                  name={aiMedicine?.name ?? m.name}
                  activeIngredient={aiMedicine?.active_ingredient ?? null}
                />

                {m.key === lastKey && suggestions.length > 0 && (
                  <View style={styles.chipWrap}>
                    {suggestions.map((s) => (
                      <Pressable
                        key={s}
                        style={styles.chip}
                        onPress={() => {
                          patchMedicine(m.key, { name: s });
                          setMatches({ query: "", names: [] });
                        }}
                      >
                        <Text style={styles.chipText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          <Pressable
            style={styles.addMedicine}
            onPress={() => setMedicines((rows) => [...rows, emptyMedicine()])}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("record.addMedicine")}
          >
            <Icon name="plus-bold" size={18} color={c.primary} />
            <Text style={styles.addMedicineText}>{t("record.addMedicine")}</Text>
          </Pressable>

          {savingsItems.length > 0 ? (
            <SavingsTotal items={savingsItems} />
          ) : null}

          <Text style={[styles.label, isUrdu && styles.urdu]}>
            {t("record.notes")}
          </Text>
          <TextInput
            style={[styles.input, styles.multiline, isUrdu && styles.urduInput]}
            placeholder={t("record.notesPlaceholder")}
            placeholderTextColor={c.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!busy}
          />

          {aiStatus !== "idle" ? (
            <View style={styles.disclaimerWrap}>
              <Text style={[styles.disclaimer, isUrdu && styles.urdu]}>
                {t("review.consent")}
              </Text>
              <Text style={[styles.disclaimer, isUrdu && styles.urdu]}>
                {t("review.disclaimer")}
              </Text>
              <Pressable
                onPress={() => router.push("/(main)/settings/privacy")}
                accessibilityRole="button"
                accessibilityLabel={t("settings.privacy")}
              >
                <Text style={styles.link}>{t("settings.privacy")}</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onSave}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t("common.save")}</Text>
            )}
          </Pressable>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: Cabinet.gutter, paddingBottom: 48 },
  label: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
    color: c.text,
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radii.lg,
    backgroundColor: c.input,
    paddingHorizontal: 16,
    minHeight: 52,
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    justifyContent: "center",
    color: c.text,
  },
  urduInput: { textAlign: "right", writingDirection: "rtl" },
  dateText: { fontFamily: Fonts.body, fontSize: FontSizes.body, color: c.text },
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 14 },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: Cabinet.cardRadius,
    backgroundColor: c.surface,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  link: {
    color: c.primary,
    fontFamily: Fonts.headingSemi,
    paddingVertical: 10,
    fontSize: FontSizes.body,
  },
  linkDanger: {
    color: c.danger,
    fontFamily: Fonts.headingSemi,
    paddingVertical: 10,
    fontSize: FontSizes.body,
  },
  photoPlaceholder: {
    height: 168,
    borderRadius: Cabinet.cardRadius,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: c.surface,
    marginTop: 8,
  },
  photoPlaceholderText: {
    color: c.textSecondary,
    fontFamily: Fonts.body,
    textAlign: "center",
    lineHeight: 24,
    fontSize: FontSizes.body,
  },
  aiAnalyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    gap: 8,
    marginTop: 8,
  },
  aiAnalyzeBtnDisabled: { opacity: 0.65 },
  aiAnalyzeBtnText: {
    color: c.onPrimary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.body,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chipWrapRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceSelected,
  },
  chipText: {
    color: c.text,
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.label,
  },
  medicineCard: {
    gap: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: Cabinet.blockRadius,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  medicineHead: { flexDirection: "row", gap: 8, alignItems: "center" },
  medicineRow: { flexDirection: "row", gap: 8 },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addMedicine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    minHeight: 44,
  },
  addMedicineText: {
    color: c.primary,
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  button: {
    backgroundColor: c.primary,
    borderRadius: Radii.xl,
    minHeight: Cabinet.actionHeight,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: c.onPrimary,
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.heading,
  },
  warningCard: {
    borderRadius: Cabinet.blockRadius,
    borderWidth: 1,
    borderColor: c.warningText,
    backgroundColor: c.warningSurface,
    padding: 14,
    gap: 6,
    marginTop: 12,
  },
  warningHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  warningTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
    color: c.warningText,
  },
  warningRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  warningBullet: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: c.warningText,
    lineHeight: 21,
  },
  warningText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    color: c.warningText,
    lineHeight: 21,
  },
  rawWrap: {
    marginTop: 12,
    borderRadius: Cabinet.blockRadius,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 12,
  },
  rawToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
  },
  rawToggleText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
    color: c.primary,
  },
  rawChevron: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.heading,
    color: c.primary,
  },
  rawText: {
    marginTop: 8,
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    color: c.textSecondary,
    lineHeight: 21,
  },
  lowChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radii.pill,
    backgroundColor: c.warningSurface,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  lowChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    color: c.warningText,
  },
  disclaimerWrap: { marginTop: 20, gap: 4 },
  disclaimer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    color: c.textSecondary,
    lineHeight: 17,
  },
  urdu: { textAlign: "right", writingDirection: "rtl" },
});
