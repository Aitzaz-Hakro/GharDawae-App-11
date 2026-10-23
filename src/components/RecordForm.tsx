import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { Stack } from "expo-router";
import { Image } from "expo-image";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { CameraCapture } from "@/components/CameraCapture";
import { CameraMark } from "@/components/CameraMark";
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
import { FontSizes, FontWeights, Radii } from "@/constants/theme";

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

export type RecordFormProps = {
  memberId: string;
  familyId: string;
  /** Photo already parked in cache by the camera screen, if any. */
  initialPhotoUri?: string;
  onSaved: () => void;
};

/**
 * The add-record form. Shared by the standalone "Add record" screen and the
 * camera flow, which pushes straight here after a capture so the shot isn't
 * lost if the user backs out of the form.
 */
export function RecordForm({
  memberId,
  familyId,
  initialPhotoUri,
  onSaved,
}: RecordFormProps) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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

  function patchMedicine(key: string, patch: Partial<MedicineDraft>) {
    setMedicines((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeMedicine(key: string) {
    setMedicines((rows) => rows.filter((r) => r.key !== key));
  }

  async function onSave() {
    const filled = medicines.filter((m) => m.name.trim());
    // Phase 6 rule: a record needs a photo or at least one medicine.
    if (!photoUri && filled.length === 0) {
      Alert.alert(
        "Nothing to save yet",
        "Add a photo of the prescription or at least one medicine.",
      );
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
      Alert.alert("Could not save", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const lastKey = medicines[medicines.length - 1]?.key;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{ headerShown: true, title: "New record" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
              <View style={styles.photoActions}>
                <Pressable onPress={() => setCameraOpen(true)}>
                  <Text style={styles.link}>Retake</Text>
                </Pressable>
                <Pressable onPress={() => setPhotoUri(null)}>
                  <Text style={styles.linkDanger}>Remove photo</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.photoPlaceholder}
              onPress={() => setCameraOpen(true)}
            >
              <CameraMark size={34} color={c.textSecondary} />
              <Text style={styles.photoPlaceholderText}>
                Photograph the prescription
              </Text>
            </Pressable>
          )}

          <CameraCapture
            visible={cameraOpen}
            title="Take photo"
            onClose={() => setCameraOpen(false)}
            onCaptured={(uri) => {
              setPhotoUri(uri);
              setCameraOpen(false);
            }}
          />

          <Text style={styles.label}>Doctor</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dr. Ahmed"
            placeholderTextColor={c.textSecondary}
            value={doctorName}
            onChangeText={setDoctorName}
            editable={!busy}
          />
          {doctors.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

          <Text style={styles.label}>Visit date</Text>
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

          <Text style={styles.label}>Diagnosis</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Viral fever"
            placeholderTextColor={c.textSecondary}
            value={diagnosis}
            onChangeText={setDiagnosis}
            editable={!busy}
          />

          <Text style={styles.label}>Medicines</Text>
          {medicines.map((m) => (
            <View key={m.key} style={styles.medicineCard}>
              <View style={styles.medicineHead}>
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="Medicine name"
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
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.medicineRow}>
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="Dosage"
                  placeholderTextColor={c.textSecondary}
                  value={m.dosage}
                  onChangeText={(v) => patchMedicine(m.key, { dosage: v })}
                  editable={!busy}
                />
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="Frequency"
                  placeholderTextColor={c.textSecondary}
                  value={m.frequency}
                  onChangeText={(v) => patchMedicine(m.key, { frequency: v })}
                  editable={!busy}
                />
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="Duration"
                  placeholderTextColor={c.textSecondary}
                  value={m.duration}
                  onChangeText={(v) => patchMedicine(m.key, { duration: v })}
                  editable={!busy}
                />
              </View>
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
          ))}
          <Pressable
            style={styles.addMedicine}
            onPress={() => setMedicines((rows) => [...rows, emptyMedicine()])}
            disabled={busy}
          >
            <Text style={styles.addMedicineText}>＋ Add another medicine</Text>
          </Pressable>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Anything else to remember"
            placeholderTextColor={c.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!busy}
          />

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onSave}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Save record</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: { padding: 20, gap: 8, paddingBottom: 48 },
  label: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.heading,
    marginTop: 16,
    color: c.text,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: FontSizes.body,
    justifyContent: "center",
    color: c.text,
  },
  dateText: { fontSize: FontSizes.body, color: c.text },
  multiline: { minHeight: 84, textAlignVertical: "top", paddingTop: 12 },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: Radii.md,
    backgroundColor: c.surface,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  link: {
    color: c.primary,
    fontWeight: FontWeights.heading,
    paddingVertical: 10,
    fontSize: FontSizes.body,
  },
  linkDanger: {
    color: c.danger,
    fontWeight: FontWeights.heading,
    paddingVertical: 10,
    fontSize: FontSizes.body,
  },
  photoPlaceholder: {
    height: 150,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: c.surface,
  },
  photoPlaceholderText: {
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    fontSize: FontSizes.body,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chipWrapRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: Radii.pill,
    backgroundColor: c.surfaceSelected,
  },
  chipText: { color: c.primary, fontSize: FontSizes.label, fontWeight: FontWeights.label },
  medicineCard: { gap: 8, marginBottom: 8 },
  medicineHead: { flexDirection: "row", gap: 8, alignItems: "center" },
  medicineRow: { flexDirection: "row", gap: 8 },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: c.danger, fontSize: 20, fontWeight: "600" },
  addMedicine: { paddingVertical: 12, minHeight: 44, justifyContent: "center" },
  addMedicineText: {
    color: c.primary,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
  },
  button: {
    backgroundColor: c.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: c.onPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
  },
});
