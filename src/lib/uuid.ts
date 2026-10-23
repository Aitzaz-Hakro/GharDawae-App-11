// Shared v4 UUID generator.
//
// Rows are created locally (offline) before ever reaching Postgres, so the app
// must mint its own ids. Not cryptographically strong — a collision needs the
// same 128-bit pattern twice; fine for row ids. Randomness quality only has to
// beat "two families both name a member Ammi", and ids are never secrets.

export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
