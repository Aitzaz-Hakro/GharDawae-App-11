import {
  Animated,
  Pressable,
  useAnimatedValue,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The one press feedback in the care UI: scale to 0.98 and back. It is short
 * enough to feel instant at a pharmacy counter, and it never replaces the
 * platform's accessibility states.
 */
export function PressableScale({
  children,
  style,
  containerStyle,
  disabled,
  ...rest
}: Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const scale = useAnimatedValue(1);

  function animate(toValue: number) {
    Animated.timing(scale, {
      toValue,
      duration: 110,
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        animate(0.98);
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        rest.onPressOut?.(event);
      }}
      style={[
        containerStyle as StyleProp<ViewStyle>,
        { transform: [{ scale }] },
        style as StyleProp<ViewStyle>,
        disabled ? { opacity: 0.55 } : null,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
