import { useCallback, useMemo, useState } from "react";
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

import { useColors, type ThemePalette } from "@/constants/useColors";
import { getDatabase } from "@/lib/powersync/db";
import { Avatar } from "@/components/Avatar";
import { LedgerRecord } from "@/components/Ledger";
import { usePhotoSource } from "@/lib/use-photo-source";
import {
  formatVisitDate,
  loadMedicinesFor,
  type Medicine,
  type Prescription,
} from "@/lib/records";
import type { Member } from "@/lib/family";
import {
  BottomTabInset,
  FontSizes,
  FontWeights,
  Radii,
} from "@/constants/theme";

type RecordRow = Prescription & { medicines: Medicine[] };

/**
 * One visit-history row. Split into its own component because resolving the
 * photo may need a network call, and hooks can't live in `renderItem`.
 */
function RecordCard({ item }: { item: RecordRow }) {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const uri = usePhotoSource(item.photo_path, item.photo_url);

  return (
    <LedgerRecord
      dateLabel={formatVisitDate(item.visit_date)}
      doctor={item.doctor_name}
      medicines={item.medicines}
      emptyNote={item.diagnosis_note || "No medicines recorded"}
      onPress={() => router.push(`/(main)/record/${item.id}`)}
      accessibilityLabel={`Record from ${formatVisitDate(item.visit_date)}${
        item.doctor_name ? `, ${item.doctor_name}` : ""
      }, ${item.medicines.length} medicine${item.medicines.length === 1 ? "" : "s"}`}
      thumb={
        uri ? (
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Text style={styles.thumbEmptyText}>Rx</Text>
          </View>
        )
      }
    />
  );
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
        <ActivityIndicator size="large" color={c.primary} />
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
                style={styles.headerAction}
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
            <View style={styles.identity}>
              <Avatar
                name={member?.name}
                type={member?.avatar_type}
                value={member?.avatar_value}
                size={64}
              />
              <View style={styles.identityText}>
                <Text style={styles.name} accessibilityRole="header">
                  {member?.name}
                </Text>
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
            </View>
            {records.length > 0 ? (
              <Text style={styles.countLine}>
                {records.length} prescription{records.length === 1 ? "" : "s"} on
                file
              </Text>
            ) : null}
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
        accessibilityRole="button"
        accessibilityLabel={`Add a prescription for ${member?.name ?? "this member"}`}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.background,
  },
  error: { color: c.danger, paddingHorizontal: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: BottomTabInset + 96 },
  headerAction: {
    minHeight: 44,
    justifyContent: "center",
  },
  head: { paddingTop: 16 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  identityText: { flex: 1 },
  name: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.title,
    color: c.text,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: FontSizes.label,
    color: c.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  editText: { color: c.primary, fontWeight: FontWeights.heading, fontSize: FontSizes.body },
  countLine: {
    marginTop: 18,
    fontSize: FontSizes.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: c.textSecondary,
  },
  empty: {
    textAlign: "center",
    color: c.textSecondary,
    marginTop: 8,
    fontSize: FontSizes.body,
    lineHeight: 24,
  },
  emptyWrap: { alignItems: "center", marginTop: 40, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.heading,
    color: c.text,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: c.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: "center",
  },
  emptyButtonText: {
    color: c.onPrimary,
    fontWeight: FontWeights.heading,
    fontSize: FontSizes.body,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radii.sm,
    backgroundColor: c.surface,
  },
  thumbEmpty: { justifyContent: "center", alignItems: "center" },
  thumbEmptyText: {
    color: c.textSecondary,
    fontWeight: "700",
    fontSize: FontSizes.label,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: BottomTabInset + 24,
    width: 60,
    height: 60,
    borderRadius: Radii.pill,
    backgroundColor: c.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: { color: c.onAccent, fontSize: 30, lineHeight: 34 },
});
