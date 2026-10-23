import { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import { listMembers, resolveFamily, type Member } from "@/lib/family";
import {
  familyMedicines,
  familyOverview,
  topMedicine,
  type FamilyOverview,
  type MedicineRow,
} from "@/lib/dashboard";
import { formatVisitDate } from "@/lib/records";
import { Illustration } from "@/components/ui/Illustration";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { ScreenHeader, IconButton } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

type Snapshot = {
  overview: FamilyOverview;
  top: { name: string; uses: number } | null;
};

export default function HealthScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const { width } = useWindowDimensions();
  const managerId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
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
      const [list, overview, top, meds] = await Promise.all([
        listMembers(family.id),
        familyOverview(family.id),
        topMedicine(family.id),
        familyMedicines(family.id, 4),
      ]);
      setMembers(list);
      setSnapshot({ overview, top });
      setMedicines(meds);
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

  const overview = snapshot?.overview;
  const coverage =
    overview && overview.memberCount > 0
      ? overview.membersWithRecords / overview.memberCount
      : 0;

  const insight = useMemo(() => {
    if (!overview) return null;
    if (overview.prescriptionCount === 0) {
      return {
        title: "Your care timeline starts here",
        body:
          members.length === 0
            ? "Add a family member, then save their first prescription. Every visit becomes easier to find."
            : "Photograph the next prescription slip — it will be here, even offline.",
      };
    }

    const pieces = [
      `${overview.prescriptionCount} prescription${overview.prescriptionCount === 1 ? "" : "s"} across ${overview.membersWithRecords} of ${overview.memberCount} family member${overview.memberCount === 1 ? "" : "s"}.`,
    ];
    if (overview.lastVisitDate) {
      pieces.push(`Last visit ${formatVisitDate(overview.lastVisitDate)}.`);
    }
    if (snapshot?.top) {
      pieces.push(
        `Most recorded medicine: ${snapshot.top.name} (${snapshot.top.uses}×).`,
      );
    }
    return {
      title: "Everything is in one place",
      body: pieces.join(" "),
    };
  }, [overview, members.length, snapshot]);

  return (
    <Screen>
      <ScreenHeader
        title="Health"
        right={
          <IconButton
            icon="magnifying-glass"
            label="Search records and medicines"
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
          <View style={[styles.errorCard, { backgroundColor: c.warningSurface, borderColor: c.border }]}>
            <Text style={[styles.errorText, { color: c.warningText }]}>{error}</Text>
            <PressableScale
              onPress={load}
              accessibilityRole="button"
              accessibilityLabel="Try loading health data again"
              style={[styles.retry, { borderColor: c.warningText }]}
            >
              <Text style={[styles.retryText, { color: c.warningText }]}>Try again</Text>
            </PressableScale>
          </View>
        ) : null}

        {loading || !overview ? (
          <View style={styles.loading}>
            <Skeleton height={230} radius={Radii.xl} />
            <Skeleton height={110} radius={Radii.xl} />
            <Skeleton height={180} radius={Radii.xl} />
          </View>
        ) : (
          <>
            <FadeIn>
              <View style={[styles.overviewCard, { backgroundColor: c.peach, borderColor: c.border }]}>
                <View style={styles.overviewCopy}>
                  <Text style={[styles.eyebrow, { color: c.peachInk }]}>
                    Health overview
                  </Text>
                  <Text style={[styles.overviewTitle, { color: c.onPeach }]}>
                    {overview.prescriptionCount === 0
                      ? "Let's begin with one record"
                      : "You're keeping things together"}
                  </Text>
                  <Text style={[styles.overviewBody, { color: c.peachInk }]}>
                    Every number below comes from prescriptions saved on this
                    phone. Nothing is guessed or filled in.
                  </Text>
                </View>

                <View style={styles.overviewMain}>
                  <ScoreRing
                    value={coverage}
                    valueLabel={
                      overview.memberCount > 0
                        ? `${Math.round(coverage * 100)}%`
                        : "—"
                    }
                    label="Care coverage"
                    caption={
                      overview.memberCount > 0
                        ? `${overview.membersWithRecords} of ${overview.memberCount} members have at least one record`
                        : "Add a family member to begin"
                    }
                    size={width < 360 ? 108 : 128}
                    strokeWidth={width < 360 ? 10 : 11}
                  />

                  <View style={styles.stats}>
                    <Stat label="Members" value={String(overview.memberCount)} />
                    <Stat
                      label="Prescriptions"
                      value={String(overview.prescriptionCount)}
                    />
                    <Stat label="Medicines" value={String(overview.medicineCount)} />
                    <Stat
                      label="Last visit"
                      value={
                        overview.lastVisitDate
                          ? formatVisitDate(overview.lastVisitDate)
                          : "—"
                      }
                    />
                  </View>
                </View>
              </View>
            </FadeIn>

            <FadeIn delay={70}>
              <SectionHeader title="Health insights" />
              {insight ? (
                <View style={[styles.insightCard, { backgroundColor: c.mint, borderColor: c.border }]}>
                  <View style={styles.insightCopy}>
                    <Text style={[styles.insightTitle, { color: c.onMint }]}>
                      {insight.title}
                    </Text>
                    <Text style={[styles.insightBody, { color: c.onMint }]}>
                      {insight.body}
                    </Text>
                  </View>
                  <Illustration variant="trend" size={64} />
                </View>
              ) : null}
            </FadeIn>

            <FadeIn delay={140}>
              <SectionHeader
                title="Medicines"
                actionLabel={medicines.length > 0 ? "View all" : undefined}
                onAction={
                  medicines.length > 0
                    ? () => router.push("/(main)/medicines")
                    : undefined
                }
              />

              {medicines.length === 0 ? (
                <EmptyState
                  icon="pill"
                  title="No medicines recorded yet"
                  body="When you save a prescription with its medicines, they will appear here with the person they belong to."
                  actionLabel={
                    members.length > 0 ? "Add a record" : "Add a family member"
                  }
                  onAction={() =>
                    router.push(
                      members.length > 0
                        ? `/(main)/record/camera?memberId=${members[0].id}`
                        : "/(main)/member/new",
                    )
                  }
                />
              ) : (
                <View style={[styles.listCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                  {medicines.map((medicine, index) => (
                    <View key={medicine.id}>
                      {index > 0 ? (
                        <View style={[styles.rule, { backgroundColor: c.border }]} />
                      ) : null}
                      <PressableScale
                        onPress={() =>
                          router.push(`/(main)/record/${medicine.prescription_id}`)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`${medicine.name} for ${medicine.member_name}, ${formatVisitDate(medicine.visit_date)}`}
                        style={styles.medicineRow}
                      >
                        <View style={[styles.medicineIcon, { backgroundColor: c.mint }]}>
                          <Icon name="pill" size={20} color={c.primary} />
                        </View>
                        <View style={styles.medicineCopy}>
                          <Text style={[styles.medicineName, { color: c.text }]} numberOfLines={1}>
                            {medicine.name}
                          </Text>
                          <Text
                            style={[styles.medicineMeta, { color: c.textSecondary }]}
                            numberOfLines={1}
                          >
                            {medicine.member_name} · {formatVisitDate(medicine.visit_date)}
                          </Text>
                        </View>
                        <Text style={[styles.medicineDose, { color: c.textSecondary }]} numberOfLines={1}>
                          {[medicine.dosage, medicine.frequency]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </Text>
                      </PressableScale>
                    </View>
                  ))}
                </View>
              )}
            </FadeIn>

            <FadeIn delay={210}>
              <SectionHeader title="Today's tip" />
              <View style={[styles.tipCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.tipCopy}>
                  <Text style={[styles.tipTitle, { color: c.text }]}>
                    Write it down while it&apos;s fresh
                  </Text>
                  <Text style={[styles.tipBody, { color: c.textSecondary }]}>
                    After a doctor&apos;s visit, note the instructions in plain
                    words. If any dosage is unclear, ask the pharmacist before
                    the next dose — this app keeps records, it does not give
                    medical advice.
                  </Text>
                </View>
                <Illustration variant="plant" size={58} />
              </View>
            </FadeIn>
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: c.peachInk }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: c.onPeach }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  loading: { gap: 12, marginTop: 8 },
  errorCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: 22,
  },
  retry: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
  },
  retryText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
  },
  overviewCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
    gap: 14,
  },
  overviewCopy: { gap: 4 },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  overviewTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.title,
    letterSpacing: -0.3,
  },
  overviewBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 20,
  },
  overviewMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stats: { flex: 1, gap: 6 },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    flexShrink: 1,
  },
  statValue: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
    fontVariant: ["tabular-nums"],
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
  },
  insightCopy: { flex: 1, gap: 3 },
  insightTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
  },
  insightBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
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
    minHeight: 64,
  },
  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  medicineCopy: { flex: 1, gap: 1 },
  medicineName: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  medicineMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
  },
  medicineDose: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    maxWidth: 92,
    textAlign: "right",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
  },
  tipCopy: { flex: 1, gap: 4 },
  tipTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
  },
  tipBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
});
