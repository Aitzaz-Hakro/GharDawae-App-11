// Family member identities (docs/06: avatar_type = 'preset').
//
// Bundled DiceBear Open Peeps portraits sit on a fixed person colour. The same
// tint follows a person into their record blocks, in both light and dark mode.
// Replace assets/avatars/<id>.svg to change the picture without changing data.
// Stored avatar_value remains the tint id; old emoji ids still resolve.

import type { ImageSource } from "expo-image";

export type AvatarTint = {
  id: string;
  /** Swatch behind the portrait. Same value in light and dark. */
  background: string;
  /** Ink for the vector fallback. */
  ink: string;
  /** Same pair, dark mode. */
  backgroundDark: string;
  inkDark: string;
};

/** Eight tints — enough to tell a family apart without turning into confetti. */
export const AVATAR_TINTS: AvatarTint[] = [
  // white on #B65C3F = 4.57:1
  { id: "clay", background: "#B65C3F", ink: "#FFFFFF", backgroundDark: "#B65C3F", inkDark: "#FFFFFF" },
  // white on #966F21 = 4.57:1
  { id: "sand", background: "#966F21", ink: "#FFFFFF", backgroundDark: "#966F21", inkDark: "#FFFFFF" },
  // white on #38807C = 4.62:1
  { id: "teal", background: "#38807C", ink: "#FFFFFF", backgroundDark: "#38807C", inkDark: "#FFFFFF" },
  // white on #8A5A9E = 5.20:1
  { id: "lilac", background: "#8A5A9E", ink: "#FFFFFF", backgroundDark: "#8A5A9E", inkDark: "#FFFFFF" },
  // white on #C24E75 = 4.53:1
  { id: "rose", background: "#C24E75", ink: "#FFFFFF", backgroundDark: "#C24E75", inkDark: "#FFFFFF" },
  // white on #5A7F55 = 4.56:1
  { id: "sage", background: "#5A7F55", ink: "#FFFFFF", backgroundDark: "#5A7F55", inkDark: "#FFFFFF" },
  // white on #467BA5 = 4.53:1
  { id: "sky", background: "#467BA5", ink: "#FFFFFF", backgroundDark: "#467BA5", inkDark: "#FFFFFF" },
  // white on #6B7280 = 4.83:1
  { id: "slate", background: "#6B7280", ink: "#FFFFFF", backgroundDark: "#6B7280", inkDark: "#FFFFFF" },
];

export function avatarTint(id: string | null | undefined): AvatarTint {
  return AVATAR_TINTS.find((t) => t.id === id) ?? AVATAR_TINTS[0];
}

/** Static requires let Metro include every replaceable SVG in the app bundle. */
export const AVATAR_PRESETS: {
  id: string;
  label: string;
  source: ImageSource | number;
}[] = [
  { id: "clay", label: "Clay", source: require("../../assets/avatars/clay.svg") },
  { id: "sand", label: "Sand", source: require("../../assets/avatars/sand.svg") },
  { id: "teal", label: "Teal", source: require("../../assets/avatars/teal.svg") },
  { id: "lilac", label: "Lilac", source: require("../../assets/avatars/lilac.svg") },
  { id: "rose", label: "Rose", source: require("../../assets/avatars/rose.svg") },
  { id: "sage", label: "Sage", source: require("../../assets/avatars/sage.svg") },
  { id: "sky", label: "Sky", source: require("../../assets/avatars/sky.svg") },
  { id: "slate", label: "Slate", source: require("../../assets/avatars/slate.svg") },
];

export function avatarPresetForStoredValue(value: string | null | undefined) {
  const tint = avatarTintForStoredValue(value);
  return AVATAR_PRESETS.find((preset) => preset.id === tint.id) ?? AVATAR_PRESETS[0];
}

/**
 * Emoji ids written before the monogram change. Kept so old rows do not lose
 * their identity — each maps onto the tint at the same index.
 */
const LEGACY_EMOJI_TO_TINT: Record<string, string> = {
  man: "teal",
  woman: "clay",
  "old-man": "sand",
  "old-woman": "sage",
  boy: "sky",
  girl: "lilac",
  baby: "rose",
  person: "slate",
};

/** Normalise any stored avatar_value (new tint id or legacy emoji id). */
export function avatarTintForStoredValue(value: string | null | undefined): AvatarTint {
  if (!value) return AVATAR_TINTS[0];
  if (AVATAR_TINTS.some((t) => t.id === value)) return avatarTint(value);
  return avatarTint(LEGACY_EMOJI_TO_TINT[value] ?? AVATAR_TINTS[0].id);
}

export const RELATIONS = [
  "Self",
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Wife",
  "Husband",
  "Son",
  "Daughter",
  "Grandmother",
  "Grandfather",
  "Other",
];
