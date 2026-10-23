// Records data access — prescriptions + their medicines. LOCAL (PowerSync/SQLite),
// works fully offline; PowerSync mirrors these rows to Supabase in the background.
//
// Types mirror src/lib/powersync/schema.ts, db/schema.sql, and
// docs/06-data-model.md.
//
// A prescription and its medicines are ONE logical unit, so writes go through a
// single db.writeTransaction — otherwise a mid-way failure could leave a record
// with no medicines (or medicines with no record).

import { getDatabase } from "@/lib/powersync/db";
import { uuid } from "@/lib/uuid";

export type Prescription = {
  id: string;
  member_id: string;
  photo_path: string | null;
  photo_url: string | null;
  doctor_name: string | null;
  visit_date: string | null;
  diagnosis_note: string | null;
  notes: string | null;
  created_at: string;
};

export type Medicine = {
  id: string;
  prescription_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  created_at: string;
};

/** A prescription plus its medicines, as used by the UI. */
export type RecordWithMedicines = Prescription & { medicines: Medicine[] };

/** A medicine as typed by the user — no id/parent/created_at until saved. */
export type MedicineInput = {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
};

export type NewPrescription = {
  /**
   * Optional pre-generated id. Pass one when the caller has already used the id
   * elsewhere — e.g. naming the saved photo file after its record.
   */
  id?: string;
  member_id: string;
  photo_path?: string | null;
  doctor_name?: string | null;
  /** ISO date (YYYY-MM-DD). Defaults to today when omitted. */
  visit_date?: string | null;
  diagnosis_note?: string | null;
  notes?: string | null;
  medicines?: MedicineInput[];
};

/** Today's date as YYYY-MM-DD in the device's local timezone (not UTC). */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a stored YYYY-MM-DD into a local Date (not UTC — avoids off-by-one). */
export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/** Format a Date as YYYY-MM-DD. */
export function formatDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Human-readable visit date for display, e.g. "8 Oct 2026". */
export function formatVisitDate(value: string | null): string {
  if (!value) return "No date";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${d} ${MONTHS[m - 1] ?? ""} ${y}`.trim();
}

/**
 * Create a prescription and its medicines atomically.
 * Fast-entry rules (docs/06): a record is valid with a photo OR >=1 medicine.
 */
export async function addPrescription(
  input: NewPrescription,
): Promise<Prescription> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const rx: Prescription = {
    id: input.id ?? uuid(),
    member_id: input.member_id,
    photo_path: input.photo_path ?? null,
    photo_url: null,
    doctor_name: input.doctor_name ?? null,
    visit_date: input.visit_date ?? today(),
    diagnosis_note: input.diagnosis_note ?? null,
    notes: input.notes ?? null,
    created_at: now,
  };

  const meds = (input.medicines ?? []).filter((m) => m.name.trim());
  const medicineRows: Medicine[] = meds.map((m) => ({
    id: uuid(),
    prescription_id: rx.id,
    name: m.name.trim(),
    dosage: m.dosage ?? null,
    frequency: m.frequency ?? null,
    duration: m.duration ?? null,
    created_at: now,
  }));

  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `INSERT INTO prescriptions
         (id, member_id, photo_path, photo_url, doctor_name, visit_date,
          diagnosis_note, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rx.id,
        rx.member_id,
        rx.photo_path,
        rx.photo_url,
        rx.doctor_name,
        rx.visit_date,
        rx.diagnosis_note,
        rx.notes,
        rx.created_at,
      ],
    );
    for (const m of medicineRows) {
      await tx.execute(
        `INSERT INTO medicines
           (id, prescription_id, name, dosage, frequency, duration, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.prescription_id, m.name, m.dosage, m.frequency, m.duration, m.created_at],
      );
    }
  });

  return rx;
}

/** All prescriptions for a member, newest visit first. */
export async function listPrescriptions(
  memberId: string,
): Promise<Prescription[]> {
  const db = await getDatabase();
  return db.getAll<Prescription>(
    `SELECT * FROM prescriptions
      WHERE member_id = ?
      ORDER BY visit_date DESC, created_at DESC`,
    [memberId],
  );
}

export async function getPrescription(
  id: string,
): Promise<Prescription | null> {
  const db = await getDatabase();
  return db.getOptional<Prescription>(
    "SELECT * FROM prescriptions WHERE id = ?",
    [id],
  );
}

/** Medicines for a prescription, in the order they were entered. */
export async function listMedicines(
  prescriptionId: string,
): Promise<Medicine[]> {
  const db = await getDatabase();
  return db.getAll<Medicine>(
    "SELECT * FROM medicines WHERE prescription_id = ? ORDER BY created_at ASC",
    [prescriptionId],
  );
}

/**
 * Load many prescriptions with their medicines in two queries total (not 1+N).
 * Returns a Map keyed by prescription id, in the same order as `ids`.
 */
export async function loadMedicinesFor(
  prescriptionIds: string[],
): Promise<Map<string, Medicine[]>> {
  const byParent = new Map<string, Medicine[]>();
  if (prescriptionIds.length === 0) return byParent;

  const db = await getDatabase();
  const placeholders = prescriptionIds.map(() => "?").join(", ");
  const rows = await db.getAll<Medicine>(
    `SELECT * FROM medicines
      WHERE prescription_id IN (${placeholders})
      ORDER BY created_at ASC`,
    prescriptionIds,
  );
  for (const row of rows) {
    const list = byParent.get(row.prescription_id);
    if (list) list.push(row);
    else byParent.set(row.prescription_id, [row]);
  }
  return byParent;
}

/** Update the free-text/date fields of a prescription. Medicines are unchanged. */
export async function updatePrescription(
  id: string,
  patch: Partial<Pick<
    Prescription,
    "doctor_name" | "visit_date" | "diagnosis_note" | "notes" | "photo_path"
  >>,
): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const db = await getDatabase();
  const setSql = entries.map(([col]) => `${col} = ?`).join(", ");
  await db.execute(`UPDATE prescriptions SET ${setSql} WHERE id = ?`, [
    ...entries.map(([, v]) => v as string | null),
    id,
  ]);
}

/** Delete a prescription and its medicines together. */
export async function deletePrescription(id: string): Promise<void> {
  const db = await getDatabase();
  await db.writeTransaction(async (tx) => {
    await tx.execute("DELETE FROM medicines WHERE prescription_id = ?", [id]);
    await tx.execute("DELETE FROM prescriptions WHERE id = ?", [id]);
  });
}

/**
 * Distinct doctor names seen for a member, most recent first — powers the
 * fast-entry "recent doctors" suggestion chips.
 */export async function recentDoctors(
  memberId: string,
  limit = 6,
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAll<{ doctor_name: string }>(
    `SELECT doctor_name, MAX(created_at) AS last_seen
       FROM prescriptions
      WHERE member_id = ? AND doctor_name IS NOT NULL AND doctor_name != ''
      GROUP BY doctor_name
      ORDER BY last_seen DESC
      LIMIT ?`,
    [memberId, limit],
  );
  return rows.map((r) => r.doctor_name);
}

/**
 * Medicine names this family has used before, most frequent first — powers the
 * medicine autocomplete. Family-wide (not per-member) on purpose: households
 * reuse the same medicines.
 */
export async function medicineSuggestions(
  familyId: string,
  prefix: string,
  limit = 8,
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAll<{ name: string }>(
    `SELECT m.name AS name, COUNT(*) AS uses
       FROM medicines m
       JOIN prescriptions p ON p.id = m.prescription_id
       JOIN members mem ON mem.id = p.member_id
      WHERE mem.family_id = ? AND m.name LIKE ?
      GROUP BY m.name
      ORDER BY uses DESC, m.name ASC
      LIMIT ?`,
    [familyId, `${prefix}%`, limit],
  );
  return rows.map((r) => r.name);
}
