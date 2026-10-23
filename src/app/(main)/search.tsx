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
import { MedicineLine } from "@/components/Ledger";
import { Magnifier } from "@/components/Magnifier";
import { FontSizes, FontWeights, Ledger, Radii } from "@/constants/theme";

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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Search" }} />

      <View style={styles.searchBar}>
        <Magnifier size={17} color={c.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Medicine, doctor, member…"
          placeholderTextColor={c.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

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
        style={styles.row}
        onPress={() => onOpen(`/(main)/member/${hit.id}`)}
      >
        <Avatar
          name={hit.name}
          type={hit.avatarType}
          value={hit.avatarValue}
          size={40}
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
        style={styles.row}
        onPress={() => onOpen(`/(main)/record/${hit.id}`)}
      >
        <View style={styles.kindMark}>
          <Text style={styles.kindMarkText}>Rx</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.title}>
            {hit.doctorName || "Prescription"} · {hit.memberName}
          </Text>
          <Text style={styles.sub}>
            {formatVisitDate(hit.visitDate)} · matched in {hit.matchedOn}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.medicineHit}
      onPress={() => onOpen(`/(main)/record/${hit.recordId}`)}
    >
      <Text style={styles.medicineContext}>
        {hit.memberName} · {formatVisitDate(hit.visitDate)}
      </Text>
      <View pointerEvents="none">
        <MedicineLine
          name={hit.name}
          dosage={hit.dosage}
          frequency={hit.frequency}
          duration={hit.duration}
        />
      </View>
    </Pressable>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: FontSizes.body,
    color: c.text,
  },
  error: { color: c.danger, paddingHorizontal: 20, paddingTop: 8 },
  hint: {
    textAlign: "center",
    color: c.textSecondary,
    marginTop: 40,
    paddingHorizontal: 32,
    fontSize: FontSizes.body,
    lineHeight: 24,
  },
  spinner: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 56,
    borderBottomWidth: Ledger.rule,
    borderBottomColor: c.border,
  },
  kindMark: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  kindMarkText: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    color: c.textSecondary,
  },
  rowBody: { flex: 1 },
  title: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
    color: c.text,
  },
  sub: { fontSize: FontSizes.label, color: c.textSecondary, marginTop: 2 },
  medicineHit: { paddingTop: 10 },
  medicineContext: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
    color: c.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
