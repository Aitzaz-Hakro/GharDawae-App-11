import { useEffect } from "react";
import { Animated, Easing, StyleSheet, Text, View, useAnimatedValue } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useColors } from "@/constants/useColors";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { FontSizes, Fonts } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A circular progress ring with a textual equivalent. The number is always
 * paired with a label and a caption so it can never be read as a diagnosis.
 */
export function ScoreRing({
  value,
  valueLabel,
  label,
  caption,
  size = 132,
  strokeWidth = 12,
}: {
  /** 0..1 */
  value: number;
  valueLabel: string;
  label: string;
  caption: string;
  size?: number;
  strokeWidth?: number;
}) {
  const c = useColors();
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useAnimatedValue(reduced ? clamped : 0);

  useEffect(() => {
    if (reduced) {
      progress.setValue(clamped);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: clamped,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, clamped, reduced]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${valueLabel}. ${caption}`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clamped * 100),
        text: `${valueLabel}. ${caption}`,
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.surfaceSelected}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference]}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { color: c.text }]}>{valueLabel}</Text>
        <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  value: {
    fontFamily: Fonts.headingBold,
    fontSize: FontSizes.title + 2,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.caption,
    textAlign: "center",
    marginTop: 1,
  },
});
