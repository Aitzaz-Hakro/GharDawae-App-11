import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The OS "reduce motion" preference. Every entrance animation in the care UI
 * checks this, so the app stays calm for people who ask for less movement.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReduced(value);
      })
      .catch(() => {
        // The preference is advisory; a failure must never block the screen.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );

    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
