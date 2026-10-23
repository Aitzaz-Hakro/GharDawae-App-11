import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { FadeIn } from "@/components/ui/FadeIn";
import { CarePortrait } from "@/components/ui/Illustration";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

const BENEFITS: {
  icon: IconName;
  title: string;
  body: string;
  tone: "peach" | "mint" | "tan";
}[] = [
  {
    icon: "pill",
    title: "Care",
    body: "Every prescription in one place",
    tone: "peach",
  },
  {
    icon: "cloud-check",
    title: "Offline",
    body: "Works with no internet",
    tone: "mint",
  },
  {
    icon: "users-three",
    title: "Together",
    body: "One home for the whole family",
    tone: "tan",
  },
];

const VALUE_CARDS: {
  icon: IconName;
  title: string;
  body: string;
}[] = [
  {
    icon: "shield-check",
    title: "Privacy first",
    body: "Your family's records stay encrypted on this phone.",
  },
  {
    icon: "device-mobile",
    title: "Offline by design",
    body: "A medicine lookup never waits for a signal.",
  },
  {
    icon: "sparkle",
    title: "ParchiiAI",
    body: "Reads slips, and asks a pharmacist to confirm anything unclear.",
  },
  {
    icon: "hand-heart",
    title: "Easy to use",
    body: "Plain words, large targets, calm surfaces.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const c = useColors();
  const { width } = useWindowDimensions();

  const heroWidth = width < 360 ? 112 : width < 400 ? 128 : 145;
  const headlineSize = width < 360 ? 25 : 29;
  const cardWidth = useMemo(
    () => (width - 32 - 12) / 2,
    [width],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.brandRow}>
              <View style={[styles.mark, { backgroundColor: c.primary }]}>
                <Icon name="heart" size={20} color={c.onPrimary} />
              </View>
              <Text style={[styles.brand, { color: c.text }]}>Ghar Dawae</Text>
              <Text style={[styles.brandUrdu, { color: c.primary }]}>گھر دوا</Text>
            </View>

            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <Text style={[styles.eyebrow, { color: c.peachInk }]}>
                  YOUR FAMILY&apos;S MEDICINES
                </Text>
                <Text
                  style={[
                    styles.headline,
                    { color: c.text, fontSize: headlineSize },
                  ]}
                  accessibilityRole="header"
                >
                  Care that connects.{"\n"}Records that stay close.
                </Text>
                <Text style={[styles.supporting, { color: c.textSecondary }]}>
                  One quiet place for every prescription, medicine and doctor
                  visit — even when the internet isn&apos;t there.
                </Text>
              </View>

              <View style={styles.heroArt}>
                <CarePortrait width={heroWidth} />
              </View>
            </View>

            <View style={styles.benefits}>
              {BENEFITS.map((benefit) => {
                const background =
                  benefit.tone === "peach"
                    ? c.peach
                    : benefit.tone === "mint"
                      ? c.mint
                      : c.tan;
                const ink =
                  benefit.tone === "peach"
                    ? c.onPeach
                    : benefit.tone === "mint"
                      ? c.onMint
                      : c.text;

                return (
                  <View
                    key={benefit.title}
                    style={[
                      styles.benefit,
                      { backgroundColor: background, borderColor: c.border },
                    ]}
                  >
                    <View style={[styles.benefitIcon, { backgroundColor: c.surface }]}>
                      <Icon name={benefit.icon} size={18} color={c.primary} />
                    </View>
                    <Text style={[styles.benefitTitle, { color: ink }]}>
                      {benefit.title}
                    </Text>
                    <Text style={[styles.benefitBody, { color: ink }]} numberOfLines={2}>
                      {benefit.body}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.actions}>
            <PrimaryButton
              label="Get started"
              icon="arrow-right"
              onPress={() => router.push("/(auth)/signup")}
            />
            <View style={styles.signInRow}>
              <Text style={[styles.signInText, { color: c.textSecondary }]}>
                Already have an account?
              </Text>
              <Pressable
                onPress={() => router.push("/(auth)/login")}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="link"
                accessibilityLabel="Sign in to an existing account"
              >
                <Text style={[styles.signInLink, { color: c.primary }]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={150}>
          <Text style={[styles.whyTitle, { color: c.text }]}>
            Why families keep it open
          </Text>
          <View style={styles.valueGrid}>
            {VALUE_CARDS.map((card) => (
              <View
                key={card.title}
                style={[
                  styles.valueCard,
                  {
                    width: cardWidth,
                    backgroundColor: c.surface,
                    borderColor: c.border,
                  },
                ]}
              >
                <View style={[styles.valueIcon, { backgroundColor: c.mint }]}>
                  <Icon name={card.icon} size={20} color={c.primary} />
                </View>
                <Text style={[styles.valueTitle, { color: c.text }]}>
                  {card.title}
                </Text>
                <Text style={[styles.valueBody, { color: c.textSecondary }]}>
                  {card.body}
                </Text>
              </View>
            ))}
          </View>
        </FadeIn>

        <Text style={[styles.footer, { color: c.textSecondary }]}>
          Built for families in Pakistan. Your records stay yours.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 14,
  },
  panel: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.title,
    letterSpacing: -0.5,
  },
  brandUrdu: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.body,
    marginLeft: "auto",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroCopy: { flex: 1, gap: 8 },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    letterSpacing: 0.6,
  },
  headline: {
    fontFamily: Fonts.headingBold,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  supporting: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
  heroArt: { alignItems: "flex-end", justifyContent: "center" },
  benefits: { flexDirection: "row", gap: 8 },
  benefit: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 10,
    gap: 5,
    minHeight: 98,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: Radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: 14,
  },
  benefitBody: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 15,
    opacity: 0.9,
  },
  actions: { gap: 4 },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 2,
    minHeight: 48,
  },
  signInText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
  },
  signInButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  signInLink: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
  },
  whyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
    marginTop: 4,
  },
  valueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
  },
  valueCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 14,
    gap: 5,
  },
  valueIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  valueTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.label,
  },
  valueBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    lineHeight: 17,
  },
  footer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    textAlign: "center",
    marginTop: 8,
  },
});
