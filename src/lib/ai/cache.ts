// Session-only cache tying a photo URI to its extraction.
//
// The assistant can read a prescription and then hand the same photo to the
// record form ("Review & save"). Without this, the form would send the same
// image to the model a second time — slower and more expensive.

import type { PrescriptionExtraction } from "./types";

const cache = new Map<string, PrescriptionExtraction>();

export function cacheExtraction(
  uri: string,
  extraction: PrescriptionExtraction,
): void {
  cache.set(uri, extraction);
}

export function getCachedExtraction(
  uri: string,
): PrescriptionExtraction | null {
  return cache.get(uri) ?? null;
}

export function clearExtractionCache(): void {
  cache.clear();
}
