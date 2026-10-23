import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { RecordForm } from "@/components/RecordForm";
import { getDatabase } from "@/lib/powersync/db";
import type { Member } from "@/lib/family";

/**
 * Add a record without going through the camera first — the fallback path when
 * the user already has a photo in their gallery, or just wants to type.
 */
export default function NewRecordScreen() {
  const router = useRouter();
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
        <ActivityIndicator size="large" />
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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  error: { color: "#C0392B", textAlign: "center" },
});
