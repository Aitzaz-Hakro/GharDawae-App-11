/**
 * Ghar Dawae theme tokens — single source of truth for color, type, spacing.
 * See docs/design-system.md for the rationale behind every value.
 *
 * Direction: calm teal (medical trust) + warm coral accent (family), red reserved
 * for danger only. System fonts (fast, no bundle cost). WCAG AA on all text pairs.
 */

import '@/global.css';

import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  light: {
    // brand
    primary: '#0C7C70', // 5.08:1 on white — teal behind white text passes AA
    primaryPressed: '#0A665C',
    accent: '#F2764E', // fills only; never behind white text (2.81:1)
    accentPressed: '#DD5F38',
    // surfaces
    background: '#FFFFFF',
    surface: '#F6F7F8',
    surfaceSelected: '#E6E8EB',
    border: '#E2E5E9',
    // text
    text: '#111417',
    textSecondary: '#5B6168',
    onPrimary: '#FFFFFF',
    onAccent: '#111417', // 6.62:1 on coral
    // semantic
    danger: '#C23B3B', // 5.25:1 on white
    success: '#2E9E6B', // fill only
    successText: '#1F7A50', // text-safe green
    warningSurface: '#FFF4E0',
    warningText: '#7A4F0A',
    infoSurface: '#EAF3FE',
    infoText: '#1E4C82',
    // legacy aliases (kept so unmigrated screens still resolve)
    backgroundElement: '#F6F7F8',
    backgroundSelected: '#E6E8EB',
  },
  dark: {
    // brand
    primary: '#2DD4BF',
    primaryPressed: '#14B8A6',
    accent: '#FF8A5E',
    accentPressed: '#F2764E',
    // surfaces
    background: '#0C0E10',
    surface: '#17191C',
    surfaceSelected: '#23262A',
    border: '#2A2E33',
    // text
    text: '#F2F4F6',
    textSecondary: '#A4ABB3',
    onPrimary: '#06201C',
    onAccent: '#1A0F08', // dark ink on bright coral
    // semantic
    danger: '#F26A6A',
    success: '#4ED197',
    successText: '#4ED197',
    warningSurface: '#2A2115',
    warningText: '#F3C98B',
    infoSurface: '#14202E',
    infoText: '#A9CBF2',
    // legacy aliases
    backgroundElement: '#17191C',
    backgroundSelected: '#23262A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Type scale (sp). Body never below 16 — elderly/caretaker friendly. */
export const FontSizes = {
  display: 28,
  title: 22,
  heading: 18,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export const FontWeights = {
  display: '700',
  title: '700',
  heading: '600',
  body: '400',
  label: '500',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Motion durations (ms) — short; app must feel instant, not animated. */
export const Motion = {
  press: 120,
  insert: 180,
  fade: 160,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Ledger metrics — the signature device (docs/design-system.md §4).
 * Every medicine line on every surface shares these numbers, so a row on the
 * family screen, a search hit and a record detail read as the same object.
 */
export const Ledger = {
  /** Ruled line under each record date. */
  rule: StyleSheet.hairlineWidth,
  /** Minimum tap target for a medicine line. */
  medicineRowMinHeight: 44,
  /** Column gap between name and the dose/frequency/duration trio. */
  columnGap: 12,
  /** Width of one ledger column at body size — keeps the trio aligned. */
  unit: 8,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
