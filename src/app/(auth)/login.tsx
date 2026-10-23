import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { signIn } from "@/lib/auth";
import { useColors, type ThemePalette } from "@/constants/useColors";
import { FontSizes, FontWeights, Radii } from "@/constants/theme";

export default function LoginScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // Auth gate in root layout redirects to (main) on session change.
    } catch (e) {
      Alert.alert("Login failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [email, password]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>Ghar Dawae</Text>
        <Text style={styles.tagline}>گھر دوا</Text>
        <Text style={styles.subtitle}>
          Your family&apos;s medicines, always with you
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!busy}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor={c.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No account? </Text>
          <Link href="/(auth)/signup" style={styles.link}>
            Sign up
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemePalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 48 },
  brand: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: c.text,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: FontSizes.heading,
    textAlign: "center",
    color: c.primary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: c.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 24,
  },
  label: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.heading,
    color: c.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: FontSizes.body,
    color: c.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: c.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: c.onPrimary,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.heading,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: c.textSecondary, fontSize: FontSizes.label },
  link: { color: c.primary, fontWeight: FontWeights.heading, fontSize: FontSizes.label },
});
