import { useCallback, useState } from "react";
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

export default function RecordDetailScreen() {
  const router = useRouter();
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
              <View key={m.id} style={styles.medicineRow}>
                <Text style={styles.medicineName}>{m.name}</Text>
                <Text style={styles.medicineMeta}>
                  {[m.dosage, m.frequency, m.duration].filter(Boolean).join(" · ") ||
                    "No dosage noted"}
                </Text>
              </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  error: { color: "#C0392B", textAlign: "center" },
  content: { padding: 20, paddingBottom: 48 },
  photo: { width: "100%", height: 260, borderRadius: 12, backgroundColor: "#F0F0F3" },
  noPhoto: { justifyContent: "center", alignItems: "center" },
  noPhotoText: { color: "#60646C" },
  section: { marginTop: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#60646C", textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 4 },
  muted: { fontSize: 15, color: "#9096A0", marginTop: 4 },
  medicineRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E3E5E9",
  },
  medicineName: { fontSize: 16, fontWeight: "600" },
  medicineMeta: { fontSize: 14, color: "#60646C", marginTop: 2 },
  deleteButton: { marginTop: 32, paddingVertical: 14, alignItems: "center" },
  deleteText: { color: "#C0392B", fontWeight: "600", fontSize: 16 },
});
