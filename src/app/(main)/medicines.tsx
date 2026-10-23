import { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import { listMembers, resolveFamily, type Member } from "@/lib/family";
import { familyMedicines, type MedicineRow } from "@/lib/dashboard";
import { formatVisitDate } from "@/lib/records";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { PressableScale } from "@/components/ui/PressableScale";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { ScreenHeader, IconButton } from "@/components/ui/ScreenHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

type Group = {
  member: Member;
  medicines: MedicineRow[];
};

export default function MedicinesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const managerId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!managerId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const family = await resolveFamily(managerId);
      const [list, rows] = await Promise.all([
        listMembers(family.id),
        familyMedicines(family.id, 200),
      ]);
      setMembers(list);
      setMedicines(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [managerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const groups = useMemo<Group[]>(() => {
    const byMember = new Map<string, Group>();
    for (const member of members) {
      byMember.set(member.id, { member, medicines: [] });
    }
    for (const medicine of medicines) {
      byMember.get(medicine.member_id)?.medicines.push(medicine);
    }
    return [...byMember.values()].filter((group) => group.medicines.length > 0);
  }, [members, medicines]);

  const memberCount = groups.length;

  return (
    <Screen>
      <ScreenHeader
        title="All medicines"
        subtitle={
          loading
            ? "Loading from this phone"
            : `${medicines.length} medicine${medicines.length === 1 ? "" : "s"} · ${memberCount} ${memberCount === 1 ? "person" : "people"}`
        }
        onBack
        right={
          <IconButton
            icon="magnifying-glass"
            label="Search medicines"
            onPress={() => router.push("/(main)/search")}
          />
        }
      />

      <ScreenScroll
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <Skeleton height={160} radius={Radii.xl} />
            <Skeleton height={160} radius={Radii.xl} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="pill"
            title="No medicines yet"
            body="Medicines appear here after you save a prescription. A record needs a photo or at least one medicine."
            actionLabel={members.length > 0 ? "Add a record" : "Add a family member"}
            onAction={() =>
              router.push(
                members.length > 0
                  ? `/(main)/record/camera?memberId=${members[0].id}`
                  : "/(main)/member/new",
              )
            }
          />
        ) : (
          groups.map((group, index) => (
            <FadeIn key={group.member.id} delay={index * 60}>
              <View style={styles.groupHead}>
                <Avatar
                  name={group.member.name}
                  type={group.member.avatar_type}
                  value={group.member.avatar_value}
                  size={36}
                />
                <Text style={[styles.groupName, { color: c.text }]} numberOfLines={1}>
                  {group.member.name}
                </Text>
                <Text style={[styles.groupCount, { color: c.textSecondary }]}>
                  {group.medicines.length}
                </Text>
              </View>

              <View style={[styles.listCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                {group.medicines.map((medicine, medIndex) => (
                  <View key={medicine.id}>
                    {medIndex > 0 ? (
                      <View style={[styles.rule, { backgroundColor: c.border }]} />
                    ) : null}
                    <PressableScale
                      onPress={() =>
                        router.push(`/(main)/record/${medicine.prescription_id}`)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${medicine.name}${medicine.dosage ? `, ${medicine.dosage}` : ""}, from ${formatVisitDate(medicine.visit_date)}`}
                      style={styles.medicineRow}
                    >
                      <View style={[styles.iconTile, { backgroundColor: c.mint }]}>
                        <Icon name="pill" size={20} color={c.primary} />
                      </View>
                      <View style={styles.medicineCopy}>
                        <Text style={[styles.medicineName, { color: c.text }]} numberOfLines={2}>
                          {medicine.name}
                        </Text>
                        <Text style={[styles.medicineFacts, { color: c.textSecondary }]} numberOfLines={2}>
                          {[medicine.dosage, medicine.frequency, medicine.duration]
                            .filter(Boolean)
                            .join(" · ") || "No dosage recorded"}
                        </Text>
                        <Text style={[styles.medicineDate, { color: c.textSecondary }]}>
                          {formatVisitDate(medicine.visit_date)}
                        </Text>
                      </View>
                      <Icon name="caret-right" size={18} color={c.textSecondary} />
                    </PressableScale>
                  </View>
                ))}
              </View>
            </FadeIn>
          ))
        )}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  loading: { gap: 12, marginTop: 8 },
  error: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    marginBottom: 12,
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  groupName: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
  },
  groupCount: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    fontVariant: ["tabular-nums"],
  },
  listCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  rule: { height: Cabinet.rule },
  medicineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 76,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  medicineCopy: { flex: 1, gap: 2 },
  medicineName: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  medicineFacts: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 19,
  },
  medicineDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    marginTop: 1,
  },
});
