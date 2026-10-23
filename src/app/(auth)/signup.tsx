import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { signUp } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/constants/privacy";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", "Re-enter to confirm.");
      return;
    }
    // Consent is required before creating an account that will hold health
    // data (docs/08 §5).
    if (!consent) {
      Alert.alert(
        "Consent needed",
        "Please read and accept how your data is stored before creating an account.",
      );
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        "Account created",
        "If email confirmation is on, check your inbox. Otherwise you're logged in.",
      );
      // Auth gate handles navigation when a session exists.
    } catch (e) {
      Alert.alert("Sign up failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>You&apos;ll manage your family&apos;s records</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 chars)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          editable={!busy}
        />

        <Pressable
          style={styles.consentRow}
          onPress={() => setConsent((v) => !v)}
          disabled={busy}
        >
          <View style={[styles.checkbox, consent && styles.checkboxOn]}>
            {consent ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            I understand my family&apos;s health records are stored on this phone
            and backed up to the cloud, and I accept the{" "}
            <Text
              style={styles.consentLink}
              onPress={() => router.push("/(main)/settings/privacy")}
            >
              privacy policy
            </Text>{" "}
            (v{PRIVACY_VERSION}).
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: "#60646C",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D3D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  consentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 4 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C3C7CE",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: "#208AEF", borderColor: "#208AEF" },
  checkmark: { color: "#fff", fontSize: 15, fontWeight: "700", lineHeight: 18 },
  consentText: { flex: 1, fontSize: 13, color: "#60646C", lineHeight: 19 },
  consentLink: { color: "#208AEF", fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { color: "#60646C" },
  link: { color: "#208AEF", fontWeight: "600" },
});
