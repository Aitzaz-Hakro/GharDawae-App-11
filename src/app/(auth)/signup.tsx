import { useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { signUp } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/constants/privacy";
import { useColors, type ThemePalette } from "@/constants/useColors";
import { Icon } from "@/components/Icon";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

export default function SignupScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title} accessibilityRole="header">
            Create account
          </Text>
          <Text style={styles.subtitle}>
            You&apos;ll manage your family&apos;s records
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={c.textSecondary}
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
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            editable={!busy}
          />

          <Pressable
            style={styles.consentRow}
            onPress={() => setConsent((v) => !v)}
            disabled={busy}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            accessibilityLabel="Accept privacy policy"
          >
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent ? (
                <Icon name="check-bold" size={16} color={c.onPrimary} />
              ) : null}
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
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={onSubmit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            {busy ? (
              <ActivityIndicator color={c.onPrimary} />
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
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    inner: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 32,
      gap: 12,
    },
    title: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.display,
      textAlign: "center",
      color: c.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radii.lg,
      backgroundColor: c.input,
      paddingHorizontal: 16,
      minHeight: 52,
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: Radii.xl,
      minHeight: Cabinet.actionHeight,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    pressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      color: c.onPrimary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
    },
    consentRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      marginTop: 4,
      minHeight: Cabinet.touchTarget,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: Radii.sm - 2,
      borderWidth: 2,
      borderColor: c.border,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },
    checkboxOn: { backgroundColor: c.primary, borderColor: c.primary },
    consentText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
      color: c.textSecondary,
      lineHeight: 21,
    },
    consentLink: {
      color: c.primary,
      fontFamily: Fonts.bodyMedium,
    },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
    footerText: {
      color: c.textSecondary,
      fontFamily: Fonts.body,
      fontSize: FontSizes.label,
    },
    link: {
      color: c.primary,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
    },
  });
