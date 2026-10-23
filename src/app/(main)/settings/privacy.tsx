import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import {
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_VERSION,
} from "@/constants/privacy";

export default function PrivacyScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 24 },
  heading: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  body: { fontSize: 15, color: "#40454D", lineHeight: 23 },
  version: { fontSize: 12, color: "#9096A0", marginTop: 8 },
});
