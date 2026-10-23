import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { RecordForm } from "@/components/RecordForm";
import { getDatabase } from "@/lib/powersync/db";
import type { Member } from "@/lib/family";
import { FontSizes, Fonts } from "@/constants/theme";

/**
 * Add a record without going through the camera first — the fallback path when
 * the user already has a photo in their gallery, or just wants to type.
 */
export default function NewRecordScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { memberId, photoUri } = useLocalSearchParams<{
    memberId: string;
    photoUri?: string;
  }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!memberId) {
        if (alive) {
          setError("No member selected.");
          setLoading(false);
        }
        return;
      }
      try {
        const db = await getDatabase();
        const row = await db.getOptional<Member>(
          "SELECT * FROM members WHERE id = ?",
          [memberId],
        );
        if (!alive) return;
        if (!row) setError("That member no longer exists.");
        else setMember(row);
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [memberId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (error || !member) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Member not found."}</Text>
      </View>
    );
  }

  return (
    <RecordForm
      memberId={member.id}
      familyId={member.family_id}
      initialPhotoUri={photoUri}
      onSaved={() => router.back()}
    />
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
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
});
