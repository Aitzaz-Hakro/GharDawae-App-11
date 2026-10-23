// PowerSync client schema — mirrors db/schema.sql (cloud) and
// docs/06-data-model.md. PowerSync auto-creates the `id` column; we declare
// only the other columns. Column types: text | integer | real.

import { Schema, Table, column } from "@powersync/react-native";

const families = new Table({
  name: column.text,
  manager_user_id: column.text,
  created_at: column.text,
});

const members = new Table(
  {
    family_id: column.text,
    name: column.text,
    avatar_type: column.text, // 'preset' | 'photo'
    avatar_value: column.text,
    relation: column.text,
    date_of_birth: column.text,
    age: column.integer,
    gender: column.text,
    created_at: column.text,
  },
  { indexes: { members_family: ["family_id"] } },
);

const prescriptions = new Table(
  {
    member_id: column.text,
    photo_path: column.text,
    photo_url: column.text,
    doctor_name: column.text,
    visit_date: column.text,
    diagnosis_note: column.text,
    notes: column.text,
    created_at: column.text,
  },
  { indexes: { prescriptions_member: ["member_id"] } },
);

const medicines = new Table(
  {
    prescription_id: column.text,
    name: column.text,
    dosage: column.text,
    frequency: column.text,
    duration: column.text,
    created_at: column.text,
  },
  { indexes: { medicines_prescription: ["prescription_id"] } },
);

export const AppSchema = new Schema({
  families,
  members,
  prescriptions,
  medicines,
});

export type Database = (typeof AppSchema)["types"];
