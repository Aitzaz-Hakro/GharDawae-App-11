// Family + member data access — LOCAL (PowerSync/SQLite), works offline.
//
// Step 1: all reads/writes hit the local encrypted SQLite DB. Data persists on
// device and works with no internet. Step 2 (cloud sync via PowerSync connector)
// will mirror this to Supabase without changing these functions.
//
// Types mirror src/lib/powersync/schema.ts & docs/06-data-model.md.

import { getDatabase } from "@/lib/powersync/db";

export type Family = {
  id: string;
  name: string;
  manager_user_id: string;
  created_at: string;
};

export type Member = {
  id: string;
  family_id: string;
  name: string;
  avatar_type: "preset" | "photo";
  avatar_value: string | null;
  relation: string | null;
  date_of_birth: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  created_at: string;
};

function uuid(): string {
  // Simple v4 UUID; sufficient for local row ids.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the manager's family, or null if none exists yet.
 * Local-only in Step 1: the app has a single family per device/manager.
 */
export async function getMyFamily(): Promise<Family | null> {
  const db = await getDatabase();
  return db.getOptional<Family>(
    "SELECT * FROM families ORDER BY created_at ASC LIMIT 1",
  );
}

/** Create the manager's family locally. managerUserId must be a real auth uuid. */
export async function createFamily(
  name: string,
  managerUserId: string,
): Promise<Family> {
  const db = await getDatabase();
  const fam: Family = {
    id: uuid(),
    name,
    manager_user_id: managerUserId,
    created_at: new Date().toISOString(),
  };
  await db.execute(
    `INSERT INTO families (id, name, manager_user_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [fam.id, fam.name, fam.manager_user_id, fam.created_at],
  );
  return fam;
}

/**
 * Ensure a family exists for a signed-in manager; create a default one if
 * missing. managerUserId MUST be the real auth user id — never a placeholder,
 * because it syncs to a Postgres `uuid` column and scopes the sync rules.
 */
export async function getOrCreateFamily(
  managerUserId: string,
  defaultName = "My Family",
): Promise<Family> {
  const existing = await getMyFamily();
  if (existing) return existing;
  return createFamily(defaultName, managerUserId);
}

/**
 * Delete any family rows that don't belong to the given manager (e.g. ones
 * created with a placeholder id before login). Local cleanup helper.
 */
export async function deleteFamiliesNotOwnedBy(
  managerUserId: string,
): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM families WHERE manager_user_id != ?", [
    managerUserId,
  ]);
}

/**
 * Resolve the signed-in manager's family: purge stale placeholder rows, then
 * return the existing family or create a default one. Requires a real auth id.
 */
export async function resolveFamily(
  managerUserId: string,
  defaultName = "My Family",
): Promise<Family> {
  await deleteFamiliesNotOwnedBy(managerUserId);
  return getOrCreateFamily(managerUserId, defaultName);
}

export async function listMembers(familyId: string): Promise<Member[]> {
  const db = await getDatabase();
  return db.getAll<Member>(
    "SELECT * FROM members WHERE family_id = ? ORDER BY created_at ASC",
    [familyId],
  );
}

export type NewMember = {
  name: string;
  relation?: string;
  avatar_type?: "preset" | "photo";
  avatar_value?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: "male" | "female" | "other" | null;
};

export async function addMember(
  familyId: string,
  m: NewMember,
): Promise<Member> {
  const db = await getDatabase();
  const member: Member = {
    id: uuid(),
    family_id: familyId,
    name: m.name,
    avatar_type: m.avatar_type ?? "preset",
    avatar_value: m.avatar_value ?? null,
    relation: m.relation ?? null,
    date_of_birth: m.date_of_birth ?? null,
    age: m.age ?? null,
    gender: m.gender ?? null,
    created_at: new Date().toISOString(),
  };
  await db.execute(
    `INSERT INTO members
       (id, family_id, name, avatar_type, avatar_value, relation,
        date_of_birth, age, gender, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id,
      member.family_id,
      member.name,
      member.avatar_type,
      member.avatar_value,
      member.relation,
      member.date_of_birth,
      member.age,
      member.gender,
      member.created_at,
    ],
  );
  return member;
}
