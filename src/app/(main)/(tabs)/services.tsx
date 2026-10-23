import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import { listMembers, resolveFamily, type Member } from "@/lib/family";
import { useSyncStatus } from "@/lib/use-sync-status";
import { FadeIn } from "@/components/ui/FadeIn";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { Screen, ScreenScroll } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

function backupSummary(sync: ReturnType<typeof useSyncStatus>): string {
  if (sync.state === "error") return "Having trouble — still trying";
  if (sync.hasPendingUploads) {
    return `${sync.pendingUploads} change${sync.pendingUploads === 1 ? "" : "s"} waiting to back up`;
  }
  if (sync.state === "syncing") return "Backing up now…";
  if (sync.state === "offline") return "Saved on this phone — will back up when online";
  return sync.lastSyncedAt ? "Up to date" : "Connected";
}

export default function ServicesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const sync = useSyncStatus();
  const managerId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!managerId) return;
      resolveFamily(managerId)
        .then((family) => listMembers(family.id))
        .then((list) => {
          if (alive) setMembers(list);
        })
        .catch(() => {
          // The actions below still work without the picker's member list.
        });
      return () => {
        alive = false;
      };
    }, [managerId]),
  );

  function openNewRecord() {
    if (members.length === 0) {
      router.push("/(main)/member/new");
      return;
    }
    setPickerOpen(true);
  }

  return (
    <Screen>
      <ScreenHeader title="Services" subtitle="Everything in one place" />

      <ScreenScroll contentContainerStyle={styles.content}>
        <FadeIn>
          <Text style={[styles.intro, { color: c.textSecondary }]}>
            The tools that keep your family&apos;s medicines findable — online or
            offline.
          </Text>
        </FadeIn>

        <FadeIn delay={50}>
          <SectionHeader title="Care tools" />
          <FeatureCard
            icon="camera"
            title="New prescription record"
            description="Photograph a slip or type the medicines"
            tone="peach"
            onPress={openNewRecord}
          />
          <FeatureCard
            icon="sparkle"
            title="AI assistant"
            description="Check a food photo or read a prescription in plain language"
            tone="mint"
            onPress={() => router.push("/(main)/assistant")}
          />
          <FeatureCard
            icon="pill"
            title="All medicines"
            description="Every medicine, grouped by person"
            tone="mint"
            onPress={() => router.push("/(main)/medicines")}
          />
          <FeatureCard
            icon="magnifying-glass"
            title="Search records"
            description="Find a person, doctor, record or medicine offline"
            onPress={() => router.push("/(main)/search")}
          />
          <FeatureCard
            icon="user-plus"
            title="Add a family member"
            description="Give someone their own record cabinet"
            onPress={() => router.push("/(main)/member/new")}
          />
        </FadeIn>

        <FadeIn delay={110}>
          <SectionHeader title="Privacy & account" />
          <FeatureCard
            icon="shield-check"
            title="Privacy & your data"
            description="What is stored, where it goes, and what stays private"
            tone="mint"
            onPress={() => router.push("/(main)/settings/privacy")}
          />
          <FeatureCard
            icon="gear"
            title="Settings & backup"
            description="Backup status, sign out, delete data"
            onPress={() => router.push("/(main)/settings")}
          />
          <FeatureCard
            icon="user-circle"
            title="Your profile"
            description="Account, family totals and session"
            onPress={() => router.navigate("/profile")}
          />
        </FadeIn>

        <FadeIn delay={170}>
          <SectionHeader title="Backup" />
          <View style={[styles.backupCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.backupLabel, { color: c.textSecondary }]}>
              Status
            </Text>
            <Text style={[styles.backupValue, { color: c.text }]}>
              {backupSummary(sync)}
            </Text>
            <Text style={[styles.backupBody, { color: c.textSecondary }]}>
              Records are written to this phone first. The cloud copy catches up
              in the background, and a missing connection never blocks your
              lookup.
            </Text>
          </View>
        </FadeIn>
      </ScreenScroll>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  intro: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    lineHeight: 23,
    marginTop: 4,
  },
  backupCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: 16,
    gap: 3,
  },
  backupLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  backupValue: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  backupBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
    marginTop: 6,
  },
});
