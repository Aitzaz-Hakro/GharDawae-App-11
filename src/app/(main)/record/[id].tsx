import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { MedicineLine } from "@/components/Ledger";
import {
  deletePrescription,
  formatVisitDate,
  getPrescription,
  listMedicines,
  type Medicine,
  type Prescription,
} from "@/lib/records";
import { deletePhoto } from "@/lib/photo";
import { usePhotoSource } from "@/lib/use-photo-source";
import { FontSizes, FontWeights, Radii } from "@/constants/theme";

export default function RecordDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<Prescription | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const rx = await getPrescription(id);
      setRecord(rx);
      setMedicines(rx ? await listMedicines(rx.id) : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function onDelete() {
    if (!record) return;
    Alert.alert(
      "Delete this record?",
      "The prescription, its medicines and the photo will be removed from this phone and from your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePrescription(record.id);
              deletePhoto(record.photo_path);
              router.back();
            } catch (e) {
              Alert.alert("Could not delete", (e as Error).message);
            }
          },
        },
      ],
    );
  }

  // Hooks must run before the early returns below.
  const uri = usePhotoSource(
    record?.photo_path ?? null,
    record?.photo_url ?? null,
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen options={{ headerShown: true, title: "Record" }} />
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "This record no longer exists."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{ headerShown: true, title: formatVisitDate(record.visit_date) }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>No photo for this record</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Doctor</Text>
          <Text style={styles.value}>{record.doctor_name || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Visit date</Text>
          <Text style={styles.value}>{formatVisitDate(record.visit_date)}</Text>
        </View>

        {record.diagnosis_note ? (
          <View style={styles.section}>
            <Text style={styles.label}>Diagnosis</Text>
            <Text style={styles.value}>{record.diagnosis_note}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>
            Medicines {medicines.length > 0 ? `(${medicines.length})` : ""}
          </Text>
          {medicines.length === 0 ? (
            <Text style={styles.muted}>No medicines recorded.</Text>
          ) : (
            medicines.map((m) => (
              <MedicineLine
                key={m.id}
                name={m.name}
                dosage={m.dosage}
                frequency={m.frequency}
                duration={m.duration}
                size="large"
              />
            ))
          )}
        </View>

        {record.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{record.notes}</Text>
          </View>
        ) : null}

        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete record</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: c.background,
  },
  error: { color: c.danger, textAlign: "center" },
  content: { padding: 20, paddingBottom: 48 },
  photo: {
    width: "100%",
    height: 260,
    borderRadius: Radii.md,
    backgroundColor: c.surface,
  },
  noPhoto: { justifyContent: "center", alignItems: "center" },
  noPhotoText: { color: c.textSecondary, fontSize: FontSizes.label },
  section: { marginTop: 22 },
  label: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    color: c.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: { fontSize: FontSizes.body, marginTop: 4, color: c.text },
  muted: { fontSize: FontSizes.label, color: c.textSecondary, marginTop: 6 },
  deleteButton: {
    marginTop: 36,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  deleteText: {
    color: c.danger,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
  },
});
