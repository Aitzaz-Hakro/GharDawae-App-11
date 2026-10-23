import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useColors } from "@/constants/useColors";
import { AVATAR_PRESETS } from "@/constants/avatars";
import { Radii } from "@/constants/theme";

export type IllustrationVariant =
  | "smiley"
  | "plant"
  | "family"
  | "shield"
  | "spark"
  | "trend"
  | "device";

/**
 * Small, flat vector scenes in the care palette. Everything is drawn from
 * tokens, so the same illustration works in light and dark without a second
 * asset set.
 */
export function Illustration({
  variant,
  size = 56,
}: {
  variant: IllustrationVariant;
  size?: number;
}) {
  const c = useColors();

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      {variant === "smiley" ? (
        <>
          <Circle cx={32} cy={32} r={28} fill={c.peachAccent} />
          <Circle cx={23} cy={27} r={3.2} fill={c.onPeach} />
          <Circle cx={41} cy={27} r={3.2} fill={c.onPeach} />
          <Path
            d="M21 38c3.4 5.2 7.4 7.8 11 7.8S39.6 43.2 43 38"
            stroke={c.onPeach}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : null}

      {variant === "plant" ? (
        <>
          <Path
            d="M32 42c-1-9-7-14-14-15 0 8 5 14 14 15Z"
            fill={c.primary}
            opacity={0.9}
          />
          <Path
            d="M32 42c1-9 7-14 14-15 0 8-5 14-14 15Z"
            fill={c.mint}
            stroke={c.primary}
            strokeWidth={1.5}
          />
          <Path d="M32 42V22" stroke={c.primary} strokeWidth={2.4} strokeLinecap="round" />
          <Path
            d="M20 44h24l-3 14a4 4 0 0 1-4 3h-10a4 4 0 0 1-4-3Z"
            fill={c.peachAccent}
          />
          <Rect x={18} y={41} width={28} height={6} rx={3} fill={c.peachInk} />
        </>
      ) : null}

      {variant === "family" ? (
        <>
          <Circle cx={20} cy={26} r={8} fill={c.peachAccent} />
          <Path d="M6 53c0-8 6-14 14-14s14 6 14 14Z" fill={c.peach} />
          <Circle cx={44} cy={26} r={8} fill={c.primary} opacity={0.85} />
          <Path d="M30 53c0-8 6-14 14-14s14 6 14 14Z" fill={c.mint} />
          <Circle cx={32} cy={20} r={7} fill={c.tan} stroke={c.surface} strokeWidth={2} />
          <Path
            d="M20 51c0-7 5.4-12 12-12s12 5 12 12Z"
            fill={c.surface}
            stroke={c.border}
            strokeWidth={1.5}
          />
        </>
      ) : null}

      {variant === "shield" ? (
        <>
          <Path
            d="M32 7 54 15v16c0 12-9 22-22 27C19 53 10 43 10 31V15Z"
            fill={c.mint}
            stroke={c.primary}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <Path
            d="m22 32 7 7 14-14"
            fill="none"
            stroke={c.primary}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "spark" ? (
        <>
          <Path
            d="M32 5c2.4 12.6 6.9 17.1 19.5 19.5C38.9 27 34.4 31.4 32 44c-2.4-12.6-6.9-17.1-19.5-19.5C25.1 22.1 29.6 17.6 32 5Z"
            fill={c.peachAccent}
          />
          <Path
            d="M49 40c1.2 6.1 3.4 8.3 9.5 9.5-6.1 1.2-8.3 3.4-9.5 9.5-1.2-6.1-3.4-8.3-9.5-9.5 6.1-1.2 8.3-3.4 9.5-9.5Z"
            fill={c.primary}
            opacity={0.75}
          />
        </>
      ) : null}

      {variant === "trend" ? (
        <>
          <Rect x={8} y={34} width={11} height={22} rx={4} fill={c.mint} />
          <Rect x={26} y={24} width={11} height={32} rx={4} fill={c.peachAccent} />
          <Rect x={44} y={12} width={11} height={44} rx={4} fill={c.primary} opacity={0.85} />
          <Path
            d="M10 22l14-8 12 6 18-12"
            fill="none"
            stroke={c.peachInk}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "device" ? (
        <>
          <Rect
            x={17}
            y={5}
            width={30}
            height={54}
            rx={9}
            fill={c.surface}
            stroke={c.primary}
            strokeWidth={2.4}
          />
          <Rect x={27} y={10} width={10} height={3} rx={1.5} fill={c.border} />
          <Path
            d="M32 43c-7-4.6-10-8-10-11.5A4.8 4.8 0 0 1 27 27c2 0 3.9 1.1 5 2.9 1.1-1.8 3-2.9 5-2.9a4.8 4.8 0 0 1 5 4.5C42 35 39 38.4 32 43Z"
            fill={c.peachAccent}
          />
        </>
      ) : null}
    </Svg>
  );
}

/**
 * The welcome portrait: a warm peach arch, a sun, and a bundled Open Peeps
 * illustration. Nothing is fetched at runtime.
 */
export function CarePortrait({
  width = 150,
  presetId,
}: {
  width?: number;
  presetId?: string;
}) {
  const c = useColors();
  const height = Math.round(width * 1.16);
  const preset =
    AVATAR_PRESETS.find((item) => item.id === presetId) ?? AVATAR_PRESETS[0];

  return (
    <View style={{ width, height }}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFill}
        accessible={false}
      >
        <Path
          d={`M0 ${height} L0 ${width / 2} A ${width / 2} ${width / 2} 0 0 1 ${width} ${width / 2} L${width} ${height} Z`}
          fill={c.peach}
        />
        <Circle
          cx={width * 0.24}
          cy={height * 0.32}
          r={width * 0.1}
          fill={c.sun}
        />
        <Path
          d={`M${width * 0.06} ${height * 0.78} C ${width * 0.1} ${height * 0.56}, ${width * 0.3} ${height * 0.54}, ${width * 0.34} ${height * 0.7} C ${width * 0.24} ${height * 0.78}, ${width * 0.14} ${height * 0.82}, ${width * 0.06} ${height * 0.78} Z`}
          fill={c.primary}
          opacity={0.9}
        />
        <Path
          d={`M${width * 0.94} ${height * 0.7} C ${width * 0.9} ${height * 0.5}, ${width * 0.72} ${height * 0.48}, ${width * 0.68} ${height * 0.64} C ${width * 0.78} ${height * 0.72}, ${width * 0.86} ${height * 0.75}, ${width * 0.94} ${height * 0.7} Z`}
          fill={c.mint}
        />
      </Svg>
      <Image
        source={preset.source}
        style={{
          position: "absolute",
          left: width * 0.06,
          bottom: 0,
          width: width * 0.88,
          height: height * 0.86,
        }}
        contentFit="contain"
        accessible={false}
      />
    </View>
  );
}

/** A soft circular frame for a member avatar used as a greeting accent. */
export function PortraitChip({
  size = 64,
  presetId,
}: {
  size?: number;
  presetId?: string;
}) {
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: Radii.pill },
      ]}
    >
      <CarePortrait width={size} presetId={presetId} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { overflow: "hidden" },
});
