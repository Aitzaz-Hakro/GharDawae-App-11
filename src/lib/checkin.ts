import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The daily wellness check-in is a local note, not a health record. It never
 * leaves the device and is never read as a symptom, so it is deliberately not
 * part of the synced SQLite tables.
 */
export type Mood = "great" | "okay" | "low";

export type CheckIn = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  mood: Mood;
};

const KEY = "ghardawae.wellness.v1";

function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function isMood(value: unknown): value is Mood {
  return value === "great" || value === "okay" || value === "low";
}

export async function getTodayCheckIn(): Promise<CheckIn | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckIn>;
    if (parsed.date !== todayKey() || !isMood(parsed.mood)) return null;
    return { date: parsed.date, mood: parsed.mood };
  } catch {
    // A corrupt local note is not worth an error state; just start fresh.
    return null;
  }
}

export async function setTodayCheckIn(mood: Mood): Promise<CheckIn> {
  const entry: CheckIn = { date: todayKey(), mood };
  await AsyncStorage.setItem(KEY, JSON.stringify(entry));
  return entry;
}

export const MOOD_LABEL: Record<Mood, string> = {
  great: "Great",
  okay: "Okay",
  low: "Not great",
};
