// Search across members, prescriptions and medicines. Local SQL only, so it
// works fully offline — the "3-tap offline lookup" journey in docs/04 depends
// on this being instant.
//
// Case sensitivity: SQLite's LIKE is case-insensitive for ASCII only. That
// covers the English UI; Urdu script is caseless anyway, so nothing is lost.
// Substring matching, not prefix — people remember "mox" or "500mg".

import { getDatabase } from "@/lib/powersync/db";

export type MemberHit = {
  kind: "member";
  id: string;
  name: string;
  avatarType: string;
  avatarValue: string | null;
  relation: string | null;
};

export type RecordHit = {
  kind: "record";
  id: string;
  memberId: string;
  memberName: string;
  visitDate: string | null;
  doctorName: string | null;
  /** Which field matched — shown so the hit explains itself. */
  matchedOn: string;
};

export type MedicineHit = {
  kind: "medicine";
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  recordId: string;
  memberId: string;
  memberName: string;
  visitDate: string | null;
};

export type SearchHit = MemberHit | RecordHit | MedicineHit;

/**
 * Escape the LIKE wildcards so a literal "%" or "_" a user types doesn't turn
 * into a match-anything. Pairs with `ESCAPE '\'` in the queries below.
 */
function likeTerm(query: string): string {
  const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

function orLike(column: string, count: number): string {
  return Array.from({ length: count }, () => `${column} LIKE ? ESCAPE '\\'`).join(" OR ");
}

/**
 * Run all three searches and return a single ranked list.
 * Pure substring match — ordering is by kind (members first, they're the
 * coarsest match) then by recency/name.
 */
export async function search(
  familyId: string,
  query: string,
): Promise<SearchHit[]> {
  const term = query.trim();
  if (term.length === 0) return [];

  const db = await getDatabase();
  const like = likeTerm(term);

  const members = await db.getAll<{
    id: string;
    name: string;
    avatar_type: string;
    avatar_value: string | null;
    relation: string | null;
  }>(
    `SELECT id, name, avatar_type, avatar_value, relation
       FROM members
      WHERE family_id = ? AND name LIKE ? ESCAPE '\\'
      ORDER BY name ASC
      LIMIT 20`,
    [familyId, like],
  );

  const records = await db.getAll<{
    id: string;
    member_id: string;
    member_name: string;
    visit_date: string | null;
    doctor_name: string | null;
    diagnosis_note: string | null;
    notes: string | null;
  }>(
    `SELECT p.id, p.member_id, mem.name AS member_name, p.visit_date,
            p.doctor_name, p.diagnosis_note, p.notes
       FROM prescriptions p
       JOIN members mem ON mem.id = p.member_id
      WHERE mem.family_id = ?
        AND (${orLike("p.doctor_name", 1)} OR ${orLike("p.diagnosis_note", 1)} OR ${orLike("p.notes", 1)})
      ORDER BY p.visit_date DESC
      LIMIT 20`,
    [familyId, like, like, like],
  );

  const medicines = await db.getAll<{
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    record_id: string;
    member_id: string;
    member_name: string;
    visit_date: string | null;
  }>(
    `SELECT md.id, md.name, md.dosage, md.frequency, md.duration,
            p.id AS record_id, p.visit_date,
            mem.id AS member_id, mem.name AS member_name
       FROM medicines md
       JOIN prescriptions p ON p.id = md.prescription_id
       JOIN members mem ON mem.id = p.member_id
      WHERE mem.family_id = ? AND md.name LIKE ? ESCAPE '\\'
      ORDER BY p.visit_date DESC
      LIMIT 20`,
    [familyId, like],
  );

  const hits: SearchHit[] = [];

  for (const m of members) {
    hits.push({
      kind: "member",
      id: m.id,
      name: m.name,
      avatarType: m.avatar_type,
      avatarValue: m.avatar_value,
      relation: m.relation,
    });
  }

  for (const r of records) {
    // Say which field matched, so a hit with an unrelated-looking doctor name
    // doesn't confuse ("why is this here?").
    const lower = term.toLowerCase();
    let matchedOn = "doctor";
    if (r.notes?.toLowerCase().includes(lower)) matchedOn = "notes";
    else if (r.diagnosis_note?.toLowerCase().includes(lower)) matchedOn = "diagnosis";

    hits.push({
      kind: "record",
      id: r.id,
      memberId: r.member_id,
      memberName: r.member_name,
      visitDate: r.visit_date,
      doctorName: r.doctor_name,
      matchedOn,
    });
  }

  for (const md of medicines) {
    hits.push({
      kind: "medicine",
      id: md.id,
      name: md.name,
      dosage: md.dosage,
      frequency: md.frequency,
      duration: md.duration,
      recordId: md.record_id,
      memberId: md.member_id,
      memberName: md.member_name,
      visitDate: md.visit_date,
    });
  }

  return hits;
}
