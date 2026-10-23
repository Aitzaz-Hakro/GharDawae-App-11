// Family + member data access — LOCAL (PowerSync/SQLite), works offline.
//
// Step 1: all reads/writes hit the local encrypted SQLite DB. Data persists on
// device and works with no internet. Step 2 (cloud sync via PowerSync connector)
// will mirror this to Supabase without changing these functions.
//
// Types mirror src/lib/powersync/schema.ts & docs/06-data-model.md.

import { getDatabase } from "@/lib/powersync/db";
import { uuid } from "@/lib/uuid";

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

/** Update a member's editable fields. Only the keys present are written. */
export async function updateMember(
  id: string,
  patch: Partial<
    Pick<
      Member,
      "name" | "relation" | "avatar_type" | "avatar_value" | "age" | "gender"
    >
  >,
): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const db = await getDatabase();
  const setSql = entries.map(([col]) => `${col} = ?`).join(", ");
  await db.execute(`UPDATE members SET ${setSql} WHERE id = ?`, [
    ...entries.map(([, v]) => v as string | number | null),
    id,
  ]);
}

/** How many prescriptions a member has — used to warn before deleting. */
export async function countPrescriptions(memberId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getOptional<{ n: number }>(
    "SELECT COUNT(*) AS n FROM prescriptions WHERE member_id = ?",
    [memberId],
  );
  return row?.n ?? 0;
}

/**
 * Prescription count per member for one family, in one query. The family grid
 * shows a count on every card, so asking per member would be N round-trips on
 * the screen that must open fastest.
 */
export async function prescriptionCounts(
  familyId: string,
): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAll<{ member_id: string; n: number }>(
    `SELECT p.member_id AS member_id, COUNT(*) AS n
       FROM prescriptions p
       JOIN members m ON m.id = p.member_id
      WHERE m.family_id = ?
      GROUP BY p.member_id`,
    [familyId],
  );
  return Object.fromEntries(rows.map((r) => [r.member_id, r.n]));
}

/** Delete a member and everything under them. Returns local photo file names
 *  so the caller can clean up the files those records owned. */
export async function deleteMemberDeep(memberId: string): Promise<string[]> {
  const db = await getDatabase();
  const photos = await db.getAll<{ photo_path: string | null }>(
    `SELECT photo_path FROM prescriptions WHERE member_id = ?`,
    [memberId],
  );

  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `DELETE FROM medicines WHERE prescription_id IN
         (SELECT id FROM prescriptions WHERE member_id = ?)`,
      [memberId],
    );
    await tx.execute("DELETE FROM prescriptions WHERE member_id = ?", [memberId]);
    await tx.execute("DELETE FROM members WHERE id = ?", [memberId]);
  });

  return photos.map((p) => p.photo_path).filter((p): p is string => !!p);
}
