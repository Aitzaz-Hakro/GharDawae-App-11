import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { RecordForm } from "@/components/RecordForm";
import type { AiStatus } from "@/components/AiBanner";
import { getDatabase } from "@/lib/powersync/db";
import type { Member } from "@/lib/family";
import { FontSizes, Fonts } from "@/constants/theme";
import { getCachedExtraction } from "@/lib/ai/cache";
import { extractPrescription } from "@/lib/ai/chat";
import {
  AIError,
  type AIErrorCode,
  type PrescriptionExtraction,
} from "@/lib/ai/types";

/**
 * Add a record without going through the camera first — the fallback path when
 * the user already has a photo in their gallery, or just wants to type.
 *
 * When a photo is present this screen also runs the AI extraction. The form
 * renders immediately: AI is an accelerator, never a requirement.
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

  const [extraction, setExtraction] = useState<PrescriptionExtraction | null>(
    () => (photoUri ? getCachedExtraction(photoUri) : null),
  );
  const [aiStatus, setAiStatus] = useState<AiStatus>(() => {
    if (!photoUri) return "idle";
    return getCachedExtraction(photoUri) ? "done" : "loading";
  });
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorCode, setAiErrorCode] = useState<AIErrorCode | null>(null);
  const [aiElapsedMs, setAiElapsedMs] = useState<number | null>(null);

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

  const runExtraction = useCallback(async (uri: string) => {
    // A prescription read in the assistant is already in the cache; do not
    // pay for the same image twice.
    const cached = getCachedExtraction(uri);
    if (cached) {
      setExtraction(cached);
      setAiStatus("done");
      setAiError(null);
      setAiErrorCode(null);
      setAiElapsedMs(null);
      return;
    }

    setAiStatus("loading");
    setAiError(null);
    setAiErrorCode(null);
    setAiElapsedMs(null);
    const started = Date.now();

    try {
      const result = await extractPrescription(uri);
      setExtraction(result);
      setAiElapsedMs(Date.now() - started);
      setAiStatus("done");
    } catch (e) {
      setAiStatus("error");
      if (e instanceof AIError) {
        setAiErrorCode(e.code);
        setAiError(e.message);
      } else {
        setAiErrorCode("api");
        setAiError((e as Error).message);
      }
    }
  }, []);

  useEffect(() => {
    if (!photoUri || getCachedExtraction(photoUri)) return;

    let alive = true;
    const started = Date.now();

    // State updates live in the promise callbacks, so the effect only starts
    // the request (and is safe to re-run on a param change).
    (async () => {
      try {
        const result = await extractPrescription(photoUri);
        if (!alive) return;
        setExtraction(result);
        setAiElapsedMs(Date.now() - started);
        setAiStatus("done");
      } catch (e) {
        if (!alive) return;
        setAiStatus("error");
        if (e instanceof AIError) {
          setAiErrorCode(e.code);
          setAiError(e.message);
        } else {
          setAiErrorCode("api");
          setAiError((e as Error).message);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [photoUri]);

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
      extraction={extraction}
      aiStatus={aiStatus}
      aiError={aiError}
      aiErrorCode={aiErrorCode}
      aiElapsedMs={aiElapsedMs}
      onRetryAi={photoUri ? () => void runExtraction(photoUri) : undefined}
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
