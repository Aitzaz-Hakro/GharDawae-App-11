import { useEffect } from "react";
import {
  Animated,
  Easing,
  useAnimatedValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Motion } from "@/constants/theme";

/**
 * Soft entrance: fade + a short upward move. Used once per card group on first
 * mount, never on every state update. Reduced-motion users get the final state
 * immediately.
 */
export function FadeIn({
  children,
  delay = 0,
  offset = 12,
  duration = Motion.enter,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
