import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { useColors, type ThemePalette } from "@/constants/useColors";
import {
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_VERSION,
} from "@/constants/privacy";
import { FontSizes, FontWeights, Ledger } from "@/constants/theme";

export default function PrivacyScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: PRIVACY_TITLE }} />
      <ScrollView contentContainerStyle={styles.content}>
        {PRIVACY_SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.version}>Version {PRIVACY_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: 20, paddingBottom: 48 },
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: Ledger.rule,
    borderBottomColor: c.border,
  },
  heading: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.heading,
    color: c.text,
    marginBottom: 6,
  },
  body: {
    fontSize: FontSizes.label + 1,
    color: c.textSecondary,
    lineHeight: 23,
  },
  version: {
    fontSize: FontSizes.caption,
    color: c.textSecondary,
    marginTop: 8,
  },
});
