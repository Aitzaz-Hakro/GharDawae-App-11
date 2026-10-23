import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import {
  listMembers,
  prescriptionCounts,
  resolveFamily,
  type Member,
} from "@/lib/family";
import { careNotes, type CareNote } from "@/lib/dashboard";
import { formatVisitDate } from "@/lib/records";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { AvatarRow } from "@/components/ui/AvatarRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { FadeIn } from "@/components/ui/FadeIn";
import { PressableScale } from "@/components/ui/PressableScale";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { ScreenHeader, IconButton } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function ConnectScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const managerId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<CareNote[]>([]);
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
      const [list, countMap, noteRows] = await Promise.all([
        listMembers(family.id),
        prescriptionCounts(family.id),
        careNotes(family.id, 4),
      ]);
      setMembers(list);
      setCounts(countMap);
      setNotes(noteRows);
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

  const totalRecords = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <Screen>
      <ScreenHeader
        title="Family"
        subtitle="The people in your care"
        right={
          <IconButton
            icon="user-plus"
            label="Add a family member"
            onPress={() => router.push("/(main)/member/new")}
            tone="primary"
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
              accessibilityLabel="Try loading the family again"
              style={[styles.retry, { borderColor: c.warningText }]}
            >
              <Text style={[styles.retryText, { color: c.warningText }]}>Try again</Text>
            </PressableScale>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <Skeleton height={110} radius={Radii.xl} />
            <Skeleton height={72} radius={Radii.lg} />
            <Skeleton height={72} radius={Radii.lg} />
          </View>
        ) : (
          <>
            <FadeIn>
              <View style={[styles.summaryCard, { backgroundColor: c.mint, borderColor: c.border }]}>
                <View style={styles.summaryCopy}>
                  <Text style={[styles.summaryEyebrow, { color: c.onMint }]}>
                    Your care circle
                  </Text>
                  <Text style={[styles.summaryTitle, { color: c.onMint }]}>
                    {members.length === 0
                      ? "No one here yet"
                      : `${members.length} ${members.length === 1 ? "person" : "people"}, ${totalRecords} ${totalRecords === 1 ? "record" : "records"}`}
                  </Text>
                  <Text style={[styles.summaryBody, { color: c.onMint }]}>
                    Only you can open this family&apos;s records. Everyone else
                    stays a person in your list, never an account.
                  </Text>
                </View>
                <Icon name="users-three" size={40} color={c.primary} />
              </View>
            </FadeIn>

            <FadeIn delay={60}>
              <SectionHeader
                title="Family & friends"
                actionLabel="Add"
                onAction={() => router.push("/(main)/member/new")}
              />
              <AvatarRow
                members={members}
                onSelect={(member) => router.push(`/(main)/member/${member.id}`)}
                onAdd={() => router.push("/(main)/member/new")}
              />
            </FadeIn>

            <FadeIn delay={120}>
              <SectionHeader title="Everyone" />
              {members.length === 0 ? (
                <EmptyState
                  icon="users-three"
                  title="Add the people you care for"
                  body="Ammi, Baba, the kids — each person gets their own records, avatar and visit history."
                  actionLabel="Add a family member"
                  onAction={() => router.push("/(main)/member/new")}
                />
              ) : (
                <View style={[styles.listCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                  {members.map((member, index) => {
                    const count = counts[member.id] ?? 0;
                    return (
                      <View key={member.id}>
                        {index > 0 ? (
                          <View style={[styles.rule, { backgroundColor: c.border }]} />
                        ) : null}
                        <PressableScale
                          onPress={() => router.push(`/(main)/member/${member.id}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`${member.name}${member.relation ? `, ${member.relation}` : ""}, ${count} prescription${count === 1 ? "" : "s"}`}
                          style={styles.memberRow}
                        >
                          <Avatar
                            name={member.name}
                            type={member.avatar_type}
                            value={member.avatar_value}
                            size={48}
                          />
                          <View style={styles.memberCopy}>
                            <Text style={[styles.memberName, { color: c.text }]} numberOfLines={1}>
                              {member.name}
                            </Text>
                            <Text
                              style={[styles.memberMeta, { color: c.textSecondary }]}
                              numberOfLines={1}
                            >
                              {[
                                member.relation,
                                member.age ? `${member.age} yrs` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Family member"}
                            </Text>
                          </View>
                          <View style={[styles.countPill, { backgroundColor: c.surfaceSelected }]}>
                            <Text style={[styles.countText, { color: c.text }]}>
                              {count}
                            </Text>
                          </View>
                          <Icon name="caret-right" size={18} color={c.textSecondary} />
                        </PressableScale>
                      </View>
                    );
                  })}
                </View>
              )}
            </FadeIn>

            <FadeIn delay={180}>
              <SectionHeader title="Care notes" />
              {notes.length === 0 ? (
                <View style={[styles.noteEmpty, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={[styles.noteEmptyTitle, { color: c.text }]}>
                    No notes yet
                  </Text>
                  <Text style={[styles.noteEmptyBody, { color: c.textSecondary }]}>
                    Diagnoses and notes you add to a prescription will appear
                    here, so the next visit starts with context.
                  </Text>
                </View>
              ) : (
                <View style={styles.notes}>
                  {notes.map((note) => (
                    <PressableScale
                      key={note.id}
                      onPress={() => router.push(`/(main)/record/${note.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Note for ${note.member_name}, ${formatVisitDate(note.visit_date)}`}
                      style={[styles.noteCard, { backgroundColor: c.surface, borderColor: c.border }]}
                    >
                      <View style={styles.noteHead}>
                        <Text style={[styles.noteMember, { color: c.text }]} numberOfLines={1}>
                          {note.member_name}
                        </Text>
                        <Text style={[styles.noteDate, { color: c.textSecondary }]} numberOfLines={1}>
                          {formatVisitDate(note.visit_date)}
                        </Text>
                      </View>
                      {note.doctor_name ? (
                        <Text style={[styles.noteDoctor, { color: c.textSecondary }]} numberOfLines={1}>
                          {note.doctor_name}
                        </Text>
                      ) : null}
                      <Text style={[styles.noteBody, { color: c.text }]} numberOfLines={3}>
                        {note.diagnosis_note || note.notes}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              )}
            </FadeIn>
          </>
        )}
      </ScreenScroll>
    </Screen>
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
  },
  summaryCopy: { flex: 1, gap: 3 },
  summaryEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  summaryTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.title,
    letterSpacing: -0.3,
  },
  summaryBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 20,
  },
  listCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  rule: { height: Cabinet.rule },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: 68,
  },
  memberCopy: { flex: 1, gap: 1 },
  memberName: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  memberMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    textTransform: "capitalize",
  },
  countPill: {
    minWidth: 30,
    height: 30,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.label,
    fontVariant: ["tabular-nums"],
  },
  notes: { gap: 10 },
  noteCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 14,
    gap: 3,
  },
  noteHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  noteMember: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
    flex: 1,
  },
  noteDate: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
  },
  noteDoctor: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
  },
  noteBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: 22,
    marginTop: 4,
  },
  noteEmpty: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  noteEmptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
  },
  noteEmptyBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
});
