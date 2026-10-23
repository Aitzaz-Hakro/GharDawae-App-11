// Family + member data access (cloud/Supabase for now; M2 swaps reads to local
// SQLite with PowerSync sync). Types mirror db/schema.sql & docs/06-data-model.md.

import { supabase } from "@/lib/supabase";

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

/** Get the current manager's family, or null if none yet. */
export async function getMyFamily(): Promise<Family | null> {
  const { data, error } = await supabase
    .from("families")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Create the manager's family (called once on first login). */
export async function createFamily(name: string): Promise<Family> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userData.user?.id;
  if (!uid) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("families")
    .insert({ name, manager_user_id: uid })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Ensure a family exists; create a default one if missing. */
export async function getOrCreateFamily(defaultName = "My Family"): Promise<Family> {
  const existing = await getMyFamily();
  if (existing) return existing;
  return createFamily(defaultName);
}

export async function listMembers(familyId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
  const { data, error } = await supabase
    .from("members")
    .insert({
      family_id: familyId,
      name: m.name,
      relation: m.relation ?? null,
      avatar_type: m.avatar_type ?? "preset",
      avatar_value: m.avatar_value ?? null,
      date_of_birth: m.date_of_birth ?? null,
      age: m.age ?? null,
      gender: m.gender ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
