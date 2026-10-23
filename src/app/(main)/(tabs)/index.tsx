import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import {
  listMembers,
  prescriptionCounts,
  resolveFamily,
  type Member,
} from "@/lib/family";
import {
  recentFamilyRecords,
  type RecentRecordWithMedicines,
} from "@/lib/dashboard";
import { formatVisitDate } from "@/lib/records";
import {
  getTodayCheckIn,
  setTodayCheckIn,
  MOOD_LABEL,
  type CheckIn,
} from "@/lib/checkin";
import { useSyncStatus } from "@/lib/use-sync-status";
import { useLanguage } from "@/i18n";
import { avatarTintForStoredValue } from "@/constants/avatars";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { SyncBanner } from "@/components/SyncBanner";
import { FadeIn } from "@/components/ui/FadeIn";
import { Illustration } from "@/components/ui/Illustration";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { PressableScale } from "@/components/ui/PressableScale";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ShortcutCard } from "@/components/ui/ShortcutCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { WellnessCheckIn } from "@/components/ui/WellnessCheckIn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const { t, isUrdu, toggle } = useLanguage();
  const { width } = useWindowDimensions();
  const sync = useSyncStatus();
  const managerId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<RecentRecordWithMedicines[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Computed once so the greeting does not flip while the screen is open.
  const [greeting] = useState(timeGreeting);

  const load = useCallback(async () => {
    if (!managerId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const family = await resolveFamily(managerId);
      const [list, countMap, recentRecords] = await Promise.all([
        listMembers(family.id),
        prescriptionCounts(family.id),
        recentFamilyRecords(family.id, 2),
      ]);
      setMembers(list);
      setCounts(countMap);
      setRecent(recentRecords);
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

  useEffect(() => {
    let alive = true;
    getTodayCheckIn().then((entry) => {
      if (alive) setCheckIn(entry);
    });
    return () => {
      alive = false;
    };
  }, []);

  const firstName = useMemo(() => {
    const meta = session?.user.user_metadata as
      | { full_name?: string; name?: string }
      | undefined;
    const raw = meta?.full_name ?? meta?.name ?? session?.user.email?.split("@")[0];
    if (!raw) return null;
    return raw.trim().split(/\s+/)[0];
  }, [session]);

  const columns = width >= 380 ? 3 : 2;
  const gridGap = 10;
  const cardWidth =
    (width - Cabinet.gutter * 2 - gridGap * (columns - 1)) / columns;

  const openNewRecord = useCallback(() => {
    if (members.length === 0) {
      router.push("/(main)/member/new");
      return;
    }
    setPickerOpen(true);
  }, [members.length, router]);

  const shortcuts = [
    {
      key: "health",
      icon: "heart" as const,
      title: "Health",
      description: "Family overview",
      tone: "peach" as const,
      onPress: () => router.navigate("/health"),
    },
    {
      key: "medicines",
      icon: "pill" as const,
      title: "Medicines",
      description: "Everything on file",
      tone: "mint" as const,
      onPress: () => router.push("/(main)/medicines"),
    },
    {
      key: "record",
      icon: "camera" as const,
      title: "New record",
      description: "Photo or type",
      tone: "tan" as const,
      onPress: openNewRecord,
    },
    {
      key: "family",
      icon: "users-three" as const,
      title: "Family",
      description: "People you care for",
      tone: "mint" as const,
      onPress: () => router.navigate("/connect"),
    },
    {
      key: "search",
      icon: "magnifying-glass" as const,
      title: "Search",
      description: "Works offline",
      tone: "peach" as const,
      onPress: () => router.push("/(main)/search"),
    },
    {
      key: "services",
      icon: "squares-four" as const,
      title: "Services",
      description: "More tools",
      tone: "tan" as const,
      onPress: () => router.navigate("/services"),
    },
  ];

  const latest = recent[0];
  const latestTint = avatarTintForStoredValue(latest?.avatar_value ?? members[0]?.avatar_value);

  return (
    <Screen>
      <View style={styles.appBar}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: c.primary }]}>
            <Icon name="heart" size={20} color={c.onPrimary} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: c.textSecondary }]}>Ghar Dawae</Text>
            <Text style={[styles.brandName, { color: c.text }]} numberOfLines={1}>
              Our family
            </Text>
          </View>
        </View>
        <View style={styles.appBarActions}>
          <PressableScale
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel="Change language"
            style={[styles.langButton, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Text style={[styles.langText, { color: c.primary }]}>
              {isUrdu ? "EN" : "اردو"}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => router.push("/(main)/search")}
            accessibilityRole="button"
            accessibilityLabel="Search records and medicines"
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Icon name="magnifying-glass" size={21} color={c.text} />
          </PressableScale>
          <PressableScale
            onPress={() => router.navigate("/profile")}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
          >
            <Icon name="gear" size={21} color={c.text} />
          </PressableScale>
        </View>
      </View>

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
        <SyncBanner status={sync} />

        <FadeIn>
          <View style={styles.greetingRow}>
            <View style={styles.greetingCopy}>
              <Text style={[styles.greeting, { color: c.text }]} accessibilityRole="header">
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </Text>
              <Text style={[styles.greetingSub, { color: c.textSecondary }]}>
                How is everyone feeling today?
              </Text>
            </View>
            {members[0] ? (
              <View style={[styles.greetingAvatar, { backgroundColor: c.surface }]}>
                <Avatar
                  name={members[0].name}
                  type={members[0].avatar_type}
                  value={members[0].avatar_value}
                  size={58}
                />
              </View>
            ) : (
              <View style={[styles.greetingIllustration, { backgroundColor: c.peach }]}>
                <Illustration variant="smiley" size={52} />
              </View>
            )}
          </View>
        </FadeIn>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: c.warningSurface, borderColor: c.border }]}>
            <Text style={[styles.errorText, { color: c.warningText }]}>{error}</Text>
            <PressableScale
              onPress={load}
              accessibilityRole="button"
              accessibilityLabel="Try loading the dashboard again"
              style={[styles.retry, { borderColor: c.warningText }]}
            >
              <Text style={[styles.retryText, { color: c.warningText }]}>Try again</Text>
            </PressableScale>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingStack}>
            <Skeleton height={142} radius={Radii.xl} />
            <View style={[styles.grid, { gap: gridGap }]}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width={cardWidth} height={118} radius={Radii.lg} />
              ))}
            </View>
            <Skeleton height={120} radius={Radii.xl} />
          </View>
        ) : (
          <>
            <FadeIn delay={60}>
              <PressableScale
                onPress={() => setCheckInOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  checkIn
                    ? `Daily wellness. Today you checked in as ${MOOD_LABEL[checkIn.mood]}. Tap to update.`
                    : "Daily wellness. Tap to check in."
                }
                style={[styles.wellnessCard, { backgroundColor: c.peach, borderColor: c.border }]}
              >
                <View style={styles.wellnessCopy}>
                  <Text style={[styles.cardEyebrow, { color: c.peachInk }]}>
                    Daily wellness
                  </Text>
                  <Text style={[styles.cardTitle, { color: c.onPeach }]}>
                    {checkIn
                      ? `Today feels ${MOOD_LABEL[checkIn.mood].toLowerCase()}`
                      : "Let's take care of you today"}
                  </Text>
                  <Text style={[styles.cardBody, { color: c.peachInk }]}>
                    {checkIn
                      ? "Your check-in is saved on this phone. Tap to update it."
                      : "A quick, private note about how you feel — not a medical check."}
                  </Text>
                  <View style={[styles.checkPill, { backgroundColor: c.primary }]}>
                    <Text style={[styles.checkPillText, { color: c.onPrimary }]}>
                      {checkIn ? "Update check-in" : "Check in"}
                    </Text>
                  </View>
                </View>
                <View style={styles.wellnessArt}>
                  <Illustration variant="smiley" size={76} />
                </View>
              </PressableScale>
            </FadeIn>

            <FadeIn delay={90}>
              <PressableScale
                onPress={() => router.push("/(main)/assistant")}
                accessibilityRole="button"
                accessibilityLabel={t("home.askAiTitle")}
                style={[styles.aiCard, { backgroundColor: c.accent, borderColor: c.border }]}
              >
                <View style={[styles.aiIcon, { backgroundColor: c.primary }]}>
                  <Icon name="sparkle" size={22} color={c.onPrimary} />
                </View>
                <View style={styles.aiCopy}>
                  <Text
                    style={[styles.aiTitle, { color: c.onAccent }, isUrdu && styles.urdu]}
                    numberOfLines={2}
                  >
                    {t("home.askAiTitle")}
                  </Text>
                  <Text
                    style={[styles.aiBody, { color: c.onAccent }, isUrdu && styles.urdu]}
                    numberOfLines={2}
                  >
                    {t("home.askAiBody")}
                  </Text>
                </View>
                <Icon name="caret-right" size={18} color={c.onAccent} />
              </PressableScale>
            </FadeIn>

            <FadeIn delay={120}>
              <SectionHeader title="What would you like to do?" />
              <View style={[styles.grid, { gap: gridGap }]}>
                {shortcuts.map((shortcut) => (
                  <ShortcutCard
                    key={shortcut.key}
                    icon={shortcut.icon}
                    title={shortcut.title}
                    description={shortcut.description}
                    tone={shortcut.tone}
                    onPress={shortcut.onPress}
                    style={{ width: cardWidth }}
                  />
                ))}
              </View>
            </FadeIn>

            <FadeIn delay={180}>
              <SectionHeader
                title="Your family"
                actionLabel={members.length > 0 ? "See all" : undefined}
                onAction={
                  members.length > 0
                    ? () => router.navigate("/connect")
                    : undefined
                }
              />

              {members.length === 0 ? (
                <EmptyState
                  icon="users-three"
                  title="Add the people you care for"
                  body="Start with Ammi, Baba or the kids. Every prescription you save afterwards stays attached to them."
                  actionLabel="Add your first member"
                  onAction={() => router.push("/(main)/member/new")}
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.familyRow}
                >
                  {members.map((member) => {
                    const count = counts[member.id] ?? 0;
                    return (
                      <PressableScale
                        key={member.id}
                        onPress={() => router.push(`/(main)/member/${member.id}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`${member.name}${member.relation ? `, ${member.relation}` : ""}, ${count} prescription${count === 1 ? "" : "s"}`}
                        style={[styles.memberCard, { backgroundColor: c.surface, borderColor: c.border }]}
                      >
                        <Avatar
                          name={member.name}
                          type={member.avatar_type}
                          value={member.avatar_value}
                          size={52}
                        />
                        <Text style={[styles.memberName, { color: c.text }]} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={[styles.memberMeta, { color: c.textSecondary }]} numberOfLines={1}>
                          {count} {count === 1 ? "record" : "records"}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </ScrollView>
              )}
            </FadeIn>

            <FadeIn delay={240}>
              <SectionHeader
                title="Latest record"
                actionLabel="Add record"
                onAction={openNewRecord}
              />

              {!latest ? (
                <EmptyState
                  icon="camera"
                  title="No prescriptions yet"
                  body="Photograph a slip after the next doctor visit. It stays readable even with no internet."
                  actionLabel={members.length > 0 ? "Add a record" : "Add a member first"}
                  onAction={
                    members.length > 0
                      ? openNewRecord
                      : () => router.push("/(main)/member/new")
                  }
                />
              ) : (
                <PressableScale
                  onPress={() => router.push(`/(main)/record/${latest.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Latest record for ${latest.member_name}, ${formatVisitDate(latest.visit_date)}`}
                  style={[
                    styles.latestCard,
                    {
                      backgroundColor: c.surface,
                      borderColor: c.border,
                      borderLeftColor: latestTint.background,
                    },
                  ]}
                >
                  <View style={styles.latestHead}>
                    <Avatar
                      name={latest.member_name}
                      type={latest.avatar_type}
                      value={latest.avatar_value}
                      size={44}
                    />
                    <View style={styles.latestCopy}>
                      <Text style={[styles.latestName, { color: c.text }]} numberOfLines={1}>
                        {latest.member_name}
                      </Text>
                      <Text style={[styles.latestMeta, { color: c.textSecondary }]} numberOfLines={1}>
                        {formatVisitDate(latest.visit_date)}
                        {latest.doctor_name ? ` · ${latest.doctor_name}` : ""}
                      </Text>
                    </View>
                    <Icon name="caret-right" size={20} color={c.textSecondary} />
                  </View>

                  {latest.medicines.length > 0 ? (
                    <View style={styles.chips}>
                      {latest.medicines.slice(0, 3).map((medicine) => (
                        <View
                          key={medicine.id}
                          style={[styles.chip, { backgroundColor: c.surfaceSelected }]}
                        >
                          <Text style={[styles.chipText, { color: c.text }]} numberOfLines={1}>
                            {[medicine.name, medicine.dosage].filter(Boolean).join(" ")}
                          </Text>
                        </View>
                      ))}
                      {latest.medicines.length > 3 ? (
                        <Text style={[styles.moreChip, { color: c.textSecondary }]}>
                          +{latest.medicines.length - 3} more
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={[styles.latestEmpty, { color: c.textSecondary }]}>
                      {latest.diagnosis_note || "No medicines recorded on this visit."}
                    </Text>
                  )}
                </PressableScale>
              )}
            </FadeIn>
          </>
        )}
      </ScreenScroll>

      {!loading ? (
        <View style={styles.fabWrap} pointerEvents="box-none">
          <PressableScale
            onPress={openNewRecord}
            accessibilityRole="button"
            accessibilityLabel="Add a new prescription record"
            style={[styles.fab, { backgroundColor: c.primary }]}
          >
            <Icon name="camera" size={21} color={c.onPrimary} />
            <Text style={[styles.fabText, { color: c.onPrimary }]}>New record</Text>
          </PressableScale>
        </View>
      ) : null}

      <MemberPicker
        visible={pickerOpen}
        members={members}
        onClose={() => setPickerOpen(false)}
        onSelect={(member) => {
          setPickerOpen(false);
          router.push(`/(main)/record/camera?memberId=${member.id}`);
        }}
        onAddMember={() => {
          setPickerOpen(false);
          router.push("/(main)/member/new");
        }}
      />

      <WellnessCheckIn
        visible={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSelect={async (mood) => {
          const entry = await setTodayCheckIn(mood);
          setCheckIn(entry);
          setCheckInOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: Cabinet.gutter,
    paddingTop: 6,
    paddingBottom: 10,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    letterSpacing: 0.3,
  },
  brandName: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.title - 2,
    letterSpacing: -0.3,
  },
  appBarActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.caption,
  },
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCopy: { flex: 1, gap: 2 },
  aiTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  aiBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 19,
    opacity: 0.9,
  },
  urdu: { textAlign: "right", writingDirection: "rtl" },
  content: { paddingTop: 4, paddingBottom: 116 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  greetingCopy: { flex: 1, gap: 3 },
  greeting: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.display,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: 22,
  },
  greetingAvatar: {
    width: 66,
    height: 66,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  greetingIllustration: {
    width: 66,
    height: 66,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
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
  loadingStack: { gap: 12, marginTop: 12 },
  wellnessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    marginTop: 18,
  },
  wellnessCopy: { flex: 1, gap: 4 },
  cardEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
    lineHeight: 24,
  },
  cardBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 20,
  },
  checkPill: {
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
    marginTop: 6,
  },
  checkPillText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
  },
  wellnessArt: { width: 76, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  familyRow: { gap: 10, paddingVertical: 2, paddingRight: 4 },
  memberCard: {
    width: 108,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 12,
    gap: 3,
    alignItems: "flex-start",
  },
  memberName: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
    marginTop: 6,
  },
  memberMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
  },
  latestCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 16,
    gap: 12,
  },
  latestHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  latestCopy: { flex: 1, gap: 2 },
  latestName: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.heading,
  },
  latestMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  chip: {
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: "100%",
  },
  chipText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
  },
  moreChip: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.label,
  },
  latestEmpty: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
  fabWrap: {
    position: "absolute",
    right: Cabinet.gutter,
    bottom: 18,
    alignItems: "flex-end",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
  },
  fabText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
});
