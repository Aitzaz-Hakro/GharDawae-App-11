// Read-only dashboard queries. Everything is local (PowerSync/SQLite) so the
// Home, Health and Connect tabs open instantly and work offline.
//
// These functions are deliberately read-only: a dashboard must never become a
// second write path next to family.ts / records.ts.

import { getDatabase } from "@/lib/powersync/db";
import {
  loadMedicinesFor,
  type Medicine,
  type Prescription,
} from "@/lib/records";

export type FamilyOverview = {
  memberCount: number;
  prescriptionCount: number;
  medicineCount: number;
  membersWithRecords: number;
  lastVisitDate: string | null;
};

export type RecentRecord = Prescription & {
  member_name: string;
  avatar_type: string;
  avatar_value: string | null;
};

export type RecentRecordWithMedicines = RecentRecord & {
  medicines: Medicine[];
};

export type MedicineRow = Medicine & {
  member_id: string;
  member_name: string;
  visit_date: string | null;
};

export type CareNote = {
  id: string;
  member_id: string;
  member_name: string;
  visit_date: string | null;
  doctor_name: string | null;
  diagnosis_note: string | null;
  notes: string | null;
};

type OverviewRow = {
  memberCount: number;
  prescriptionCount: number;
  medicineCount: number;
  membersWithRecords: number;
  lastVisitDate: string | null;
};

/**
 * One query for the four numbers the Health card shows. Sub-selects keep it to
 * a single round-trip on the screen that must paint first.
 */
export async function familyOverview(
  familyId: string,
): Promise<FamilyOverview> {
  const db = await getDatabase();
  const row = await db.getOptional<OverviewRow>(
    `SELECT
       (SELECT COUNT(*) FROM members WHERE family_id = ?) AS memberCount,
       (SELECT COUNT(*)
          FROM prescriptions p
          JOIN members m ON m.id = p.member_id
         WHERE m.family_id = ?) AS prescriptionCount,
       (SELECT COUNT(*)
          FROM medicines md
          JOIN prescriptions p ON p.id = md.prescription_id
          JOIN members m ON m.id = p.member_id
         WHERE m.family_id = ?) AS medicineCount,
       (SELECT COUNT(DISTINCT p.member_id)
          FROM prescriptions p
          JOIN members m ON m.id = p.member_id
         WHERE m.family_id = ?) AS membersWithRecords,
       (SELECT MAX(p.visit_date)
          FROM prescriptions p
          JOIN members m ON m.id = p.member_id
         WHERE m.family_id = ?) AS lastVisitDate`,
    [familyId, familyId, familyId, familyId, familyId],
  );

  return {
    memberCount: row?.memberCount ?? 0,
    prescriptionCount: row?.prescriptionCount ?? 0,
    medicineCount: row?.medicineCount ?? 0,
    membersWithRecords: row?.membersWithRecords ?? 0,
    lastVisitDate: row?.lastVisitDate ?? null,
  };
}

/** Newest prescriptions across the whole family, with member identity. */
export async function recentFamilyRecords(
  familyId: string,
  limit = 3,
): Promise<RecentRecordWithMedicines[]> {
  const db = await getDatabase();
  const rows = await db.getAll<RecentRecord>(
    `SELECT p.*, m.name AS member_name, m.avatar_type AS avatar_type,
            m.avatar_value AS avatar_value
       FROM prescriptions p
       JOIN members m ON m.id = p.member_id
      WHERE m.family_id = ?
      ORDER BY p.visit_date DESC, p.created_at DESC
      LIMIT ?`,
    [familyId, limit],
  );

  const medicines = await loadMedicinesFor(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...row,
    medicines: medicines.get(row.id) ?? [],
  }));
}

/** Every medicine in the family, newest visit first, with its owner. */
export async function familyMedicines(
  familyId: string,
  limit = 100,
): Promise<MedicineRow[]> {
  const db = await getDatabase();
  return db.getAll<MedicineRow>(
    `SELECT md.*, m.id AS member_id, m.name AS member_name,
            p.visit_date AS visit_date
       FROM medicines md
       JOIN prescriptions p ON p.id = md.prescription_id
       JOIN members m ON m.id = p.member_id
      WHERE m.family_id = ?
      ORDER BY p.visit_date DESC, md.created_at ASC
      LIMIT ?`,
    [familyId, limit],
  );
}

/** Real diagnosis/note lines, used by the Connect tab as "Care notes". */
export async function careNotes(
  familyId: string,
  limit = 5,
): Promise<CareNote[]> {
  const db = await getDatabase();
  return db.getAll<CareNote>(
    `SELECT p.id, p.member_id, m.name AS member_name, p.visit_date,
            p.doctor_name, p.diagnosis_note, p.notes
       FROM prescriptions p
       JOIN members m ON m.id = p.member_id
      WHERE m.family_id = ?
        AND (
          (p.diagnosis_note IS NOT NULL AND p.diagnosis_note != '')
          OR (p.notes IS NOT NULL AND p.notes != '')
        )
      ORDER BY p.visit_date DESC, p.created_at DESC
      LIMIT ?`,
    [familyId, limit],
  );
}

/** The most frequently recorded medicine, when the data supports an insight. */
export async function topMedicine(
  familyId: string,
): Promise<{ name: string; uses: number } | null> {
  const db = await getDatabase();
  const row = await db.getOptional<{ name: string; uses: number }>(
    `SELECT md.name AS name, COUNT(*) AS uses
       FROM medicines md
       JOIN prescriptions p ON p.id = md.prescription_id
       JOIN members m ON m.id = p.member_id
      WHERE m.family_id = ?
      GROUP BY md.name
      ORDER BY uses DESC, md.name ASC
      LIMIT 1`,
    [familyId],
  );
  return row ? { name: row.name, uses: row.uses } : null;
}
