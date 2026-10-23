import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { getDatabase } from "@/lib/powersync/db";
import { Avatar } from "@/components/Avatar";
import { RecordBlock } from "@/components/Cabinet";
import { Icon } from "@/components/Icon";
import {
  formatVisitDate,
  loadMedicinesFor,
  type Medicine,
  type Prescription,
} from "@/lib/records";
import type { Member } from "@/lib/family";
import { avatarTintForStoredValue } from "@/constants/avatars";
import { useLanguage } from "@/i18n";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

type RecordRow = Prescription & { medicines: Medicine[] };

/**
 * One visit-history row. Split into its own component because resolving the
 * photo may need a network call, and hooks can't live in `renderItem`.
 */
function RecordCard({ item, accentColor }: { item: RecordRow; accentColor: string }) {
  const router = useRouter();

  return (
    <View style={{ marginBottom: Cabinet.gap }}>
      <RecordBlock
        dateLabel={formatVisitDate(item.visit_date)}
        doctor={item.doctor_name}
        medicines={item.medicines}
        accentColor={accentColor}
        emptyNote={item.diagnosis_note || "No medicines recorded"}
        onPress={() => router.push(`/(main)/record/${item.id}`)}
        accessibilityLabel={`Record from ${formatVisitDate(item.visit_date)}${
          item.doctor_name ? `, ${item.doctor_name}` : ""
        }, ${item.medicines.length} medicine${item.medicines.length === 1 ? "" : "s"}`}
      />
    </View>
  );
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(c, insets.bottom), [c, insets.bottom]);
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

  const tint = useMemo(
    () => avatarTintForStoredValue(member?.avatar_value),
    [member?.avatar_value],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
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
          headerRight: () =>
            member ? (
              <Pressable
                onPress={() => router.push(`/(main)/member/${member.id}/edit`)}
                hitSlop={8}
                style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${member.name}`}
              >
                <Icon name="pencil-simple" size={22} color={c.primary} />
              </Pressable>
            ) : null,
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={load}
            tintColor={c.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.head}>
            <View style={styles.identity}>
              <Avatar
                name={member?.name}
                type={member?.avatar_type}
                value={member?.avatar_value}
                size={80}
              />
              <View style={styles.identityText}>
                <Text style={styles.name} accessibilityRole="header" numberOfLines={1}>
                  {member?.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
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

            <Pressable
              style={({ pressed }) => [styles.aiAction, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: "/(main)/assistant",
                  params: { memberId: member?.id ?? id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${t("member.askAbout")} ${member?.name ?? ""}`}
            >
              <Icon name="sparkle" size={20} color={c.primary} />
              <Text style={styles.aiActionText}>
                {t("member.askAbout")} {member?.name ?? ""}
              </Text>
            </Pressable>

            <View style={[styles.countBanner, { borderLeftColor: tint.background }]}>
              <Text style={styles.countValue}>{records.length}</Text>
              <Text style={styles.countLabel}>
                {records.length === 1
                  ? "prescription on file"
                  : "prescriptions on file"}
              </Text>
            </View>

            {records.length > 0 ? (
              <Text style={styles.sectionTitle}>{t("member.visitHistory")}</Text>
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
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
              onPress={() => router.push(`/(main)/record/camera?memberId=${id}`)}
            >
              <Icon name="camera" size={22} color={c.onPrimary} />
              <Text style={styles.emptyButtonText}>{t("member.newRecord")}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <RecordCard item={item} accentColor={tint.background} />
        )}
      />

      <View style={[styles.fabWrap, { bottom: insets.bottom + 24 }]} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          onPress={() => router.push(`/(main)/record/camera?memberId=${id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Add a prescription for ${member?.name ?? "this member"}`}
        >
          <Icon name="camera-fill" size={24} color={c.onPrimary} />
          <Text style={styles.fabText}>{t("member.newRecord")}</Text>
        </Pressable>
      </View>
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
      backgroundColor: c.background,
    },
    error: {
      color: c.danger,
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: 8,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    list: {
      paddingHorizontal: Cabinet.gutter,
      paddingBottom: Cabinet.bottomInset + bottomInset,
    },
    headerAction: {
      width: Cabinet.touchTarget,
      height: Cabinet.touchTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: { opacity: 0.8 },
    head: { paddingTop: 4, paddingBottom: 8 },
    identity: { flexDirection: "row", alignItems: "center", gap: 16 },
    identityText: { flex: 1 },
    name: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.display,
      color: c.text,
      letterSpacing: -0.4,
    },
    sub: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      marginTop: 2,
      textTransform: "capitalize",
    },
    aiAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      minHeight: 44,
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    aiActionText: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.primary,
    },
    countBanner: {
      marginTop: 20,
      borderRadius: Cabinet.blockRadius,
      borderLeftWidth: Cabinet.edgeWidth,
      backgroundColor: c.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 10,
    },
    countValue: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.stat,
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    countLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      flexShrink: 1,
    },
    sectionTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.title,
      color: c.text,
      marginTop: 24,
      marginBottom: 12,
    },
    emptyWrap: { alignItems: "center", marginTop: 32, paddingHorizontal: 8 },
    emptyTitle: {
      fontFamily: Fonts.heading,
      fontSize: FontSizes.title,
      color: c.text,
      marginBottom: 8,
    },
    empty: {
      textAlign: "center",
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      lineHeight: 24,
    },
    emptyButton: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      paddingHorizontal: 24,
      minHeight: Cabinet.actionHeight,
    },
    emptyButtonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
    fabWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      paddingHorizontal: Cabinet.gutter,
      alignItems: "flex-end",
    },
    fab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 60,
      paddingHorizontal: 22,
      borderRadius: Radii.xl,
      backgroundColor: c.primary,
    },
    fabText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
  });
