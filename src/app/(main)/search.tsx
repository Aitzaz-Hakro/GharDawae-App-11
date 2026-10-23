import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, type Href } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { useAuth } from "@/lib/auth-context";
import { resolveFamily } from "@/lib/family";
import { search, type SearchHit } from "@/lib/search";
import { formatVisitDate } from "@/lib/records";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

type Family = { id: string };

export default function SearchScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [family, setFamily] = useState<Family | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const managerId = session?.user.id;

  useEffect(() => {
    // No session: the auth gate redirects away; nothing to resolve.
    if (!managerId) return;
    let alive = true;
    resolveFamily(managerId)
      .then((f) => {
        if (alive) setFamily({ id: f.id });
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      });
    return () => {
      alive = false;
    };
  }, [managerId]);

  useEffect(() => {
    const term = query.trim();
    if (!family || term.length === 0) return;

    let alive = true;
    // Debounce so we're not querying on every keystroke.
    const timer = setTimeout(() => {
      setRunning(true);
      search(family.id, term)
        .then((results) => {
          if (alive) {
            setHits(results);
            setError(null);
          }
        })
        .catch((e) => {
          if (alive) setError((e as Error).message);
        })
        .finally(() => {
          if (alive) setRunning(false);
        });
    }, 150);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, family]);

  // Empty input = no results; derive rather than clearing in an effect.
  const results = query.trim().length === 0 ? [] : hits;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Search",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.background },
        }}
      />

      <View style={styles.searchBar}>
        <Icon name="magnifying-glass" size={22} color={c.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Search people, records, medicines"
          placeholderTextColor={c.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {query.trim().length === 0 ? (
        <Text style={styles.hint}>
          Search works offline — try a medicine name like “Panadol”, a doctor, or
          a family member.
        </Text>
      ) : running && results.length === 0 ? (
        <ActivityIndicator style={styles.spinner} color={c.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.hint}>No matches for “{query.trim()}”.</Text>
          }
          renderItem={({ item }) => <HitRow hit={item} onOpen={router.push} />}
        />
      )}
    </SafeAreaView>
  );
}

function HitRow({
  hit,
  onOpen,
}: {
  hit: SearchHit;
  onOpen: (href: Href) => void;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (hit.kind === "member") {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => onOpen(`/(main)/member/${hit.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${hit.name}${hit.relation ? `, ${hit.relation}` : ""}`}
      >
        <Avatar
          name={hit.name}
          type={hit.avatarType}
          value={hit.avatarValue}
          size={44}
        />
        <View style={styles.rowBody}>
          <Text style={styles.title}>{hit.name}</Text>
          <Text style={styles.sub}>
            {hit.relation ? `${hit.relation} · Member` : "Member"}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (hit.kind === "record") {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => onOpen(`/(main)/record/${hit.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Prescription for ${hit.memberName}, ${formatVisitDate(hit.visitDate)}`}
      >
        <View style={styles.kindMark}>
          <Icon name="pill-fill" size={22} color={c.textSecondary} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.title} numberOfLines={1}>
            {hit.doctorName || "Prescription"} · {hit.memberName}
          </Text>
          <Text style={styles.sub}>
            {formatVisitDate(hit.visitDate)} · matched in {hit.matchedOn}
          </Text>
        </View>
      </Pressable>
    );
  }

  // A medicine is always name, dosage, frequency, duration — in that order.
  const facts = [hit.dosage, hit.frequency, hit.duration].filter(Boolean);
  return (
    <Pressable
      style={({ pressed }) => [styles.medicineHit, pressed && styles.pressed]}
      onPress={() => onOpen(`/(main)/record/${hit.recordId}`)}
      accessibilityRole="button"
      accessibilityLabel={`${hit.name}${facts.length ? `, ${facts.join(", ")}` : ""}, from ${hit.memberName}'s record on ${formatVisitDate(hit.visitDate)}`}
    >
      <Text style={styles.medicineContext}>
        {hit.memberName} · {formatVisitDate(hit.visitDate)}
      </Text>
      <Text style={styles.medicineName}>{hit.name}</Text>
      <Text style={styles.medicineFacts} numberOfLines={1}>
        {facts.length > 0 ? facts.join("  ·  ") : "No dosage recorded"}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginHorizontal: Cabinet.gutter,
      marginTop: 4,
      paddingHorizontal: 16,
      minHeight: 56,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.input,
    },
    input: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      minHeight: 54,
    },
    error: {
      color: c.danger,
      paddingHorizontal: Cabinet.gutter,
      paddingTop: 8,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
    },
    hint: {
      textAlign: "center",
      color: c.textSecondary,
      marginTop: 40,
      paddingHorizontal: 32,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      lineHeight: 24,
    },
    spinner: { marginTop: 40 },
    list: {
      paddingHorizontal: Cabinet.gutter,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 10,
    },
    card: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      padding: 14,
      minHeight: 64,
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    pressed: { opacity: 0.8 },
    kindMark: {
      width: 44,
      height: 44,
      borderRadius: Radii.pill,
      backgroundColor: c.surfaceSelected,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: { flex: 1 },
    title: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.body,
      color: c.text,
    },
    sub: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      marginTop: 2,
    },
    medicineHit: {
      padding: 14,
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: 2,
    },
    medicineContext: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
    },
    medicineName: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
      color: c.text,
      marginTop: 2,
    },
    medicineFacts: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
  });
