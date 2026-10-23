// Preset avatars for family members (docs/06 avatar_type = 'preset').
// Using emoji keeps v1 dependency-free; Design Day may swap for custom icons.

export type AvatarPreset = {
  id: string;
  emoji: string;
  label: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "man", emoji: "👨", label: "Man" },
  { id: "woman", emoji: "👩", label: "Woman" },
  { id: "old-man", emoji: "👴", label: "Elder man" },
  { id: "old-woman", emoji: "👵", label: "Elder woman" },
  { id: "boy", emoji: "👦", label: "Boy" },
  { id: "girl", emoji: "👧", label: "Girl" },
  { id: "baby", emoji: "👶", label: "Baby" },
  { id: "person", emoji: "🧑", label: "Person" },
];

export function presetEmoji(id: string | null | undefined): string {
  return AVATAR_PRESETS.find((p) => p.id === id)?.emoji ?? "🧑";
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
