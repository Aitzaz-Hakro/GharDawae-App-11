/**
 * Ghar Dawae theme tokens — single source of truth for color, type, spacing.
 * See docs/design-system.md for the rationale behind every value.
 *
 * Direction: Warm Cabinet. A cream paper base, a deep green for actions, warm
 * ink for text, and a fixed family palette of eight person colours. The warmth
 * is carried by surface and type, never by decoration.
 *
 * Every text pair below was measured, not assumed. Ratios are inline so a
 * future change has to argue with a number.
 */

import { StyleSheet } from 'react-native';

export const Colors = {
  light: {
    // brand — deep green, the one action colour
    primary: '#2F6B4F', // 6.29:1 with white
    primaryPressed: '#255840',
    // accent is a calm green SURFACE (count banner), not the action colour
    accent: '#DCEBE0',
    accentPressed: '#CFE3D5',
    // surfaces
    background: '#F7F1E6', // warm paper
    surface: '#FFFBF3', // cards
    surfaceSelected: '#EFE8D9', // chips, muted wells
    input: '#FFFDF8',
    border: '#DCD2BE',
    // text
    text: '#1E2A32', // 13.04:1 on background
    textSecondary: '#5A6370', // 5.41:1 on background, 5.89:1 on card
    onPrimary: '#FFFFFF',
    onAccent: '#1F4D38', // 7.81:1 on accent
    // semantic
    danger: '#B3261E', // 6.33:1 on card
    success: '#2E7D5B',
    successText: '#1F5C43',
    warningSurface: '#F7E7C6',
    warningText: '#6B4A0C',
    infoSurface: '#DDEBE8',
    infoText: '#1F4D48',
    // legacy aliases (kept so unmigrated screens still resolve)
    backgroundElement: '#FFFBF3',
    backgroundSelected: '#EFE8D9',
  },
  dark: {
    // warm night: brown-black paper, not a blue-grey dark mode
    primary: '#5FAE85',
    primaryPressed: '#4E9E76',
    accent: '#22352A',
    accentPressed: '#2A4133',
    background: '#14120E',
    surface: '#1F1B15',
    surfaceSelected: '#2A251C',
    input: '#191510',
    border: '#3A3327',
    text: '#F5EFE3', // 16.34:1 on background
    textSecondary: '#B4AB9A', // 8.22:1 on background
    onPrimary: '#0E1F16', // 6.43:1 on primary
    onAccent: '#A9D8BC', // 8.22:1 on accent
    danger: '#F28B82', // 7.17:1 on card
    success: '#7BD3A4',
    successText: '#7BD3A4',
    warningSurface: '#33280F',
    warningText: '#F0C97A',
    infoSurface: '#1B2A33',
    infoText: '#A7CBE0',
    // legacy aliases
    backgroundElement: '#1F1B15',
    backgroundSelected: '#2A251C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Font families. Each weight is its own loaded family, because React Native
 * synthesises bold badly on Android: asking a 700 file for fontWeight 700
 * thickens it a second time. Always pick the family, never the weight.
 */
export const Fonts = {
  body: 'SourceSans3_400',
  bodyMedium: 'SourceSans3_600',
  bodyBold: 'SourceSans3_700',
  heading: 'NunitoSans_700',
  headingSemi: 'NunitoSans_600',
  headingBold: 'NunitoSans_800',
} as const;

/** Type scale (sp). Body never below 16 — caretaker-friendly. */
export const FontSizes = {
  display: 28,
  title: 22,
  heading: 18,
  body: 16,
  label: 14,
  caption: 12,
  /** Visit dates: the largest element on a record. */
  recordDate: 30,
  /** The count on the prescriptions banner. */
  stat: 32,
} as const;

export const Motion = {
  press: 120,
  insert: 180,
  fade: 160,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Cabinet metrics — the Warm Cabinet layout constants.
 * Cards breathe on a 20px radius, record blocks carry a 6px person-colour
 * edge, and the screen gutter is 20.
 */
export const Cabinet = {
  /** Outer screen gutter. */
  gutter: 20,
  /** Radius of a card or the photo target. */
  cardRadius: 20,
  /** Radius of a record or medicine block. */
  blockRadius: 18,
  /** Width of the person-colour edge on a record block. */
  edgeWidth: 6,
  /** Gap between cards in a stack or grid. */
  gap: 12,
  /** Hairline used for inner rules. */
  rule: StyleSheet.hairlineWidth,
  /** Minimum tap target. */
  touchTarget: 44,
  /** Primary action height. */
  actionHeight: 56,
  /** Bottom clearance so the floating action never covers the last card. */
  bottomInset: 96,
} as const;