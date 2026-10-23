// Turn the many ways a dose is written into the three schedule slots.
//
// Used as a fallback when the model returns an empty `times` array, and as a
// safety net for manual entries. Pure and side-effect free.

import type { DoseTime } from "@/lib/ai/types";

const ORDER: DoseTime[] = ["morning", "afternoon", "night"];

export function parseSchedule(frequency: string | null | undefined): DoseTime[] {
  if (!frequency) return [];
  const text = frequency.toLowerCase();

  // "1-0-1", "1 + 1 + 0", "1/0/1"
  const numeric = /(\d)\s*[-+/]\s*(\d)\s*[-+/]\s*(\d)/.exec(text);
  if (numeric) {
    const parts = [numeric[1], numeric[2], numeric[3]];
    return ORDER.filter((_, i) => Number(parts[i]) > 0);
  }

  const hits = new Set<DoseTime>();
  if (/morning|subah|صبح|breakfast/.test(text)) hits.add("morning");
  if (/afternoon|dopahar|دوپہر|lunch/.test(text)) hits.add("afternoon");
  if (/night|raat|رات|bedtime|dinner|hs\b/.test(text)) hits.add("night");

  if (/\b(qid|q\.i\.d|four times|4 times|chaar)\b/.test(text)) {
    ORDER.forEach((t) => hits.add(t));
  } else if (/\b(tds|t\.i\.d|tid|three times|3 times|thrice)\b/.test(text)) {
    ORDER.forEach((t) => hits.add(t));
  } else if (/\b(bd|b\.i\.d|bid|twice|2 times|do dafa)\b/.test(text)) {
    hits.add("morning");
    hits.add("night");
  } else if (/\b(od|o\.d|once|daily|roz|1 time)\b/.test(text)) {
    hits.add("morning");
  }

  return ORDER.filter((t) => hits.has(t));
}

export function humanizeSchedule(times: DoseTime[]): string | null {
  if (times.length === 0) return null;
  const labels = times.map((t) =>
    t === "morning" ? "Morning" : t === "afternoon" ? "Afternoon" : "Night",
  );
  return labels.join(" + ");
}
