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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { MedicineCard } from "@/components/Cabinet";
import { Icon } from "@/components/Icon";
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
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function RecordDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);
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
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "Record" }} />
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "This record no longer exists."}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.dateLabel}>Visit date</Text>
        <Text style={styles.date} accessibilityRole="header">
          {formatVisitDate(record.visit_date)}
        </Text>

        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Icon name="pill-fill" size={32} color={c.textSecondary} />
            <Text style={styles.noPhotoText}>No photo for this record</Text>
          </View>
        )}

        <View style={styles.card}>
          <Row label="Doctor" value={record.doctor_name || "—"} c={c} />
          <View style={styles.rule} />
          <Row label="Visit date" value={formatVisitDate(record.visit_date)} c={c} />
          {record.diagnosis_note ? (
            <>
              <View style={styles.rule} />
              <Row label="Diagnosis" value={record.diagnosis_note} c={c} />
            </>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>
          {medicines.length > 0 ? `Medicines · ${medicines.length}` : "Medicines"}
        </Text>
        {medicines.length === 0 ? (
          <Text style={styles.muted}>No medicines recorded.</Text>
        ) : (
          <View style={styles.medicineList}>
            {medicines.map((m) => (
              <MedicineCard key={m.id} medicine={m} />
            ))}
          </View>
        )}

        {record.notes ? (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.noteText}>{record.notes}</Text>
            </View>
          </>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete this record"
        >
          <Icon name="trash" size={20} color={c.danger} />
          <Text style={styles.deleteText}>Delete record</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** One labelled fact inside a card. */
function Row({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: ThemePalette;
}) {
  return (
    <View>
      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.label, color: c.textSecondary }}>
        {label}
      </Text>
      <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.body, color: c.text, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (c: ThemePalette, bottomInset: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: c.background,
    },
    error: {
      color: c.danger,
      textAlign: "center",
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    content: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: bottomInset + 40,
    },
    dateLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    date: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.recordDate,
      color: c.text,
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.4,
      marginBottom: 16,
    },
    photo: {
      width: "100%",
      height: 260,
      borderRadius: Cabinet.cardRadius,
      backgroundColor: c.surface,
    },
    noPhoto: { justifyContent: "center", alignItems: "center", gap: 8 },
    noPhotoText: {
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    card: {
      marginTop: 16,
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      gap: 12,
    },
    rule: { height: Cabinet.rule, backgroundColor: c.border },
    sectionTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.title,
      color: c.text,
      marginTop: 28,
      marginBottom: 12,
    },
    medicineList: { gap: Cabinet.gap },
    muted: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    noteText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      lineHeight: 24,
    },
    deleteButton: {
      marginTop: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: Cabinet.actionHeight,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.8 },
    deleteText: {
      color: c.danger,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
    },
  });
