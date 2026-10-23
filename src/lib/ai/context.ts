// Assemble the minimum member context the model needs.
//
// Deliberately excludes the member's name and the manager's email: age,
// gender, current medicines, and recent diagnosis notes are enough for a food
// check, and less data leaves the device.

import { getDatabase } from "@/lib/powersync/db";
import type { Member } from "@/lib/family";
import { listPrescriptions, loadMedicinesFor } from "@/lib/records";
import type { MemberContext } from "./types";

export async function buildMemberContext(
  memberId: string,
): Promise<MemberContext | null> {
  const db = await getDatabase();
  const member = await db.getOptional<Member>(
    "SELECT * FROM members WHERE id = ?",
    [memberId],
  );
  if (!member) return null;

  const prescriptions = (await listPrescriptions(memberId)).slice(0, 5);
  const medicinesByRx = await loadMedicinesFor(prescriptions.map((r) => r.id));

  const medicines: string[] = [];
  for (const rx of prescriptions) {
    for (const med of medicinesByRx.get(rx.id) ?? []) {
      const label = [med.name, med.dosage].filter(Boolean).join(" ");
      const line = med.frequency ? `${label} (${med.frequency})` : label;
      if (line && !medicines.includes(line)) medicines.push(line);
    }
  }

  const recentNotes = prescriptions
    .map((rx) => rx.diagnosis_note ?? rx.notes)
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    .slice(0, 3)
    .map((n) => n.trim().slice(0, 180));

  return {
    id: member.id,
    name: member.name,
    age: member.age,
    gender: member.gender,
    medicines: medicines.slice(0, 12),
    recent_notes: recentNotes,
  };
}
