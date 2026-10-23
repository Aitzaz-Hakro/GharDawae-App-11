import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { getDatabase } from "@/lib/powersync/db";
import { presetEmoji } from "@/constants/avatars";
import { photoUri } from "@/lib/photo";
import { usePhotoSource } from "@/lib/use-photo-source";
import {
  formatVisitDate,
  loadMedicinesFor,
  type Medicine,
  type Prescription,
} from "@/lib/records";
import type { Member } from "@/lib/family";

type RecordRow = Prescription & { medicines: Medicine[] };

/**
 * One visit-history row. Split into its own component because resolving the
 * photo may need a network call, and hooks can't live in `renderItem`.
 */
function RecordCard({ item }: { item: RecordRow }) {
  const router = useRouter();
  const uri = usePhotoSource(item.photo_path, item.photo_url);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(main)/record/${item.id}`)}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Text style={styles.thumbEmptyText}>Rx</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardDate}>{formatVisitDate(item.visit_date)}</Text>
        <Text style={styles.cardDoctor} numberOfLines={1}>
          {item.doctor_name || "Doctor not noted"}
        </Text>
        <Text style={styles.cardMeds} numberOfLines={2}>
          {item.medicines.length > 0
            ? item.medicines.map((m) => m.name).join(", ")
            : item.diagnosis_note || "No medicines recorded"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const db = await getDatabase();
      const row = await db.getOptional<Member>(
        "SELECT * FROM members WHERE id = ?",
        [id],
      );
      setMember(row ?? null);
      if (!row) {
        setRecords([]);
        return;
      }

      const rx = await db.getAll<Prescription>(
        `SELECT * FROM prescriptions
          WHERE member_id = ?
          ORDER BY visit_date DESC, created_at DESC`,
        [row.id],
      );
      // Two queries total instead of one per prescription.
      const meds = await loadMedicinesFor(rx.map((r) => r.id));
      setRecords(rx.map((r) => ({ ...r, medicines: meds.get(r.id) ?? [] })));
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: member?.name ?? "Member",
          headerRight: () =>
            member ? (
              <Pressable
                onPress={() => router.push(`/(main)/member/${member.id}/edit`)}
                hitSlop={8}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            ) : null,
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.head}>
            <View style={styles.avatar}>
              {member?.avatar_type === "photo" && member.avatar_value ? (
                <Image
                  source={{ uri: photoUri(member.avatar_value) ?? member.avatar_value }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>
                  {member?.avatar_type === "preset"
                    ? presetEmoji(member?.avatar_value)
                    : "🧑"}
                </Text>
              )}
            </View>
            <Text style={styles.name}>{member?.name}</Text>
            <Text style={styles.sub}>
              {[
                member?.relation,
                member?.age ? `${member.age} yrs` : null,
                member?.gender,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.empty}>
              Photograph a slip after the next doctor visit and it will be here —
              even with no internet.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push(`/(main)/record/camera?memberId=${id}`)}
            >
              <Text style={styles.emptyButtonText}>Add a record</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <RecordCard item={item} />}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push(`/(main)/record/camera?memberId=${id}`)}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#C0392B", paddingHorizontal: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  head: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0F0F3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 96, height: 96 },
  avatarEmoji: { fontSize: 48 },
  name: { fontSize: 24, fontWeight: "700", marginTop: 12 },
  sub: { fontSize: 14, color: "#60646C", marginTop: 4 },
  editText: { color: "#208AEF", fontWeight: "600", fontSize: 16 },
  empty: {
    textAlign: "center",
    color: "#60646C",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyWrap: { alignItems: "center", marginTop: 32, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#208AEF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  card: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E3E5E9",
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#F0F0F3" },
  thumbEmpty: { justifyContent: "center", alignItems: "center" },
  thumbEmptyText: { color: "#9096A0", fontWeight: "700" },
  cardBody: { flex: 1, justifyContent: "center" },
  cardDate: { fontSize: 12, color: "#60646C", fontWeight: "600" },
  cardDoctor: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  cardMeds: { fontSize: 14, color: "#60646C", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#208AEF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36 },
});
