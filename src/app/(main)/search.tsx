import { useEffect, useState } from "react";
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

import { useAuth } from "@/lib/auth-context";
import { resolveFamily } from "@/lib/family";
import { search, type SearchHit } from "@/lib/search";
import { formatVisitDate } from "@/lib/records";
import { presetEmoji } from "@/constants/avatars";

type Family = { id: string };

export default function SearchScreen() {
  const router = useRouter();
  const { session } = useAuth();
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
        <TextInput
          style={styles.input}
          placeholder="Medicine, doctor, member…"
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
        <ActivityIndicator style={styles.spinner} />
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
  if (hit.kind === "member") {
    return (
      <Pressable
        style={styles.row}
        onPress={() => onOpen(`/(main)/member/${hit.id}`)}
      >
        <Text style={styles.avatar}>
          {hit.avatarType === "preset" ? presetEmoji(hit.avatarValue) : "🧑"}
        </Text>
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
        <Text style={styles.avatar}>📄</Text>
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

  const meta = [hit.dosage, hit.frequency, hit.duration].filter(Boolean).join(" · ");
  return (
    <Pressable
      style={styles.row}
      onPress={() => onOpen(`/(main)/record/${hit.recordId}`)}
    >
      <Text style={styles.avatar}>💊</Text>
      <View style={styles.rowBody}>
        <Text style={styles.title}>{hit.name}</Text>
        <Text style={styles.sub}>
          {meta ? `${meta} · ` : ""}
          {hit.memberName} · {formatVisitDate(hit.visitDate)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchBar: { paddingHorizontal: 20, paddingTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D0D3D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: "#C0392B", paddingHorizontal: 20, paddingTop: 8 },
  hint: {
    textAlign: "center",
    color: "#60646C",
    marginTop: 40,
    paddingHorizontal: 32,
    fontSize: 15,
    lineHeight: 22,
  },
  spinner: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E3E5E9",
  },
  avatar: { fontSize: 26, width: 34, textAlign: "center" },
  rowBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 13, color: "#60646C", marginTop: 2 },
});
