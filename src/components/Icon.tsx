import { Path, Svg } from "react-native-svg";

import { ICON_GEOMETRY } from "./iconGeometry";

/**
 * Phosphor icons, embedded as SVG paths. Paths are generated into
 * `iconGeometry.ts` rather than fetched at runtime: the app must render its
 * marks on the first frame, offline.
 *
 * The filled/bold aliases are kept for the Warm Cabinet surfaces that predate
 * the care redesign; new UI uses the regular line marks.
 */
const LEGACY_GEOMETRY = {
  "camera-fill": {
    viewBox: "0 0 256 256",
    paths: [
      "M208 56h-27.72l-13.63-20.44A8 8 0 0 0 160 32H96a8 8 0 0 0-6.65 3.56L75.71 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24m-44 76a36 36 0 1 1-36-36a36 36 0 0 1 36 36",
    ],
  },
  "check-bold": {
    viewBox: "0 0 256 256",
    paths: [
      "m232.49 80.49l-128 128a12 12 0 0 1-17 0l-56-56a12 12 0 1 1 17-17L96 183L215.51 63.51a12 12 0 0 1 17 17Z",
    ],
  },
  "house-line-fill": {
    viewBox: "0 0 256 256",
    paths: [
      "M240 208h-16v-72l2.34 2.34A8 8 0 0 0 237.66 127l-98.35-98.32a16 16 0 0 0-22.62 0L18.34 127a8 8 0 0 0 11.32 11.31L32 136v72H16a8 8 0 0 0 0 16h224a8 8 0 0 0 0-16m-88 0h-48v-48a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4Z",
    ],
  },
  "pill-fill": {
    viewBox: "0 0 256 256",
    paths: [
      "M216.43 39.6a53.27 53.27 0 0 0-75.33 0L39.6 141.09a53.26 53.26 0 0 0 75.32 75.31l101.51-101.49a53.32 53.32 0 0 0 0-75.31m-11.32 64l-50.75 50.74l-52.69-52.68l50.75-50.75a37.26 37.26 0 0 1 52.69 52.69m-15.43-21.26a8 8 0 0 1 0 11.32l-24 24a8 8 0 1 1-11.31-11.32l24-24a8 8 0 0 1 11.31 0",
    ],
  },
  "plus-bold": {
    viewBox: "0 0 256 256",
    paths: [
      "M228 128a12 12 0 0 1-12 12h-76v76a12 12 0 0 1-24 0v-76H40a12 12 0 0 1 0-24h76V40a12 12 0 0 1 24 0v76h76a12 12 0 0 1 12 12",
    ],
  },
} as const;

const GEOMETRY: Record<
  string,
  { viewBox: string; paths: readonly string[] }
> = { ...LEGACY_GEOMETRY, ...ICON_GEOMETRY };

export type IconName =
  | keyof typeof ICON_GEOMETRY
  | keyof typeof LEGACY_GEOMETRY;

export function Icon({
  name,
  size = 24,
  color,
}: {
  name: IconName;
  size?: number;
  color: string;
}) {
  const geo = GEOMETRY[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox={geo.viewBox}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {geo.paths.map((d, i) => (
        <Path key={i} d={d} fill={color} />
      ))}
    </Svg>
  );
}
