// Family member identities (docs/06: avatar_type = 'preset').
//
// Avatars are MONOGRAMS, not emoji. Why:
//  - The default Android font renders 👴/👵 as a white or yellow face, which
//    reads wrong for a Pakistani family app and looked like a toy.
//  - A letter + tint stays legible at 44sp avatar size, on low-end screens, and
//    in dark mode, and it is what a ledger would print: an initial in a stamp.
// Stored `avatar_value` is the tint id (e.g. "teal"); the letter comes from the
// member's name at render time. Emoji ids stored before this change still
// resolve, so existing rows keep a sensible avatar.

export type AvatarTint = {
  id: string;
  /** Swatch behind the letter (light mode). */
  background: string;
  /** The letter itself (light mode). */
  ink: string;
  /** Same pair, dark mode. */
  backgroundDark: string;
  inkDark: string;
};

/** Eight tints — enough to tell a family apart without turning into confetti. */
export const AVATAR_TINTS: AvatarTint[] = [
  { id: "teal", background: "#DCEEEC", ink: "#0A5A52", backgroundDark: "#12302C", inkDark: "#8CE0D5" },
  { id: "clay", background: "#FBE3D8", ink: "#8A3A1B", backgroundDark: "#33190F", inkDark: "#FFB392" },
  { id: "sand", background: "#F3E9CF", ink: "#6B5316", backgroundDark: "#2C2615", inkDark: "#DFC98C" },
  { id: "sage", background: "#DFEBDD", ink: "#3B5F38", backgroundDark: "#1B2A1A", inkDark: "#A8D3A2" },
  { id: "sky", background: "#DCE8F5", ink: "#274F7A", backgroundDark: "#16232F", inkDark: "#A6C8E8" },
  { id: "lilac", background: "#E7E1F2", ink: "#4A3A6B", backgroundDark: "#211D2C", inkDark: "#C3B2E4" },
  { id: "rose", background: "#F6DDE2", ink: "#7A2F40", backgroundDark: "#2E181D", inkDark: "#E9ADBA" },
  { id: "slate", background: "#E4E7EB", ink: "#3A424C", backgroundDark: "#1E2329", inkDark: "#B7C0CA" },
];

export function avatarTint(id: string | null | undefined): AvatarTint {
  return AVATAR_TINTS.find((t) => t.id === id) ?? AVATAR_TINTS[0];
}

/**
 * One or two characters for the stamp. First letter of the first and last word
 * ("Ammi" -> A, "Zara Khan" -> ZK), upper-cased. Scripts without case (Urdu)
 * are returned unchanged, which is correct.
 */
export function avatarInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
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
