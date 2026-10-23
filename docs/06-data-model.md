# Ghar Dawae — Phase 6: Data Model & Records

_Last updated: 2026-09-26_

## Decisions
- **Member vs User = Model A (v1):** members are **data records only**. Only the
  **manager** has a login. Members (Baba, kids, etc.) never log in — they are
  people whose records the manager tracks. Simpler; matches "one manager runs it."
- **Avatar:** preset icons **+** optional photo upload.
- **Medicines stored as separate structured items** (AI-ready + searchable).
- Prescription field list confirmed.

## Entities

### User (login account) — v1 = the manager only
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | |
| email_or_phone | string | login identifier |
| password_hash | string | never store plaintext |
| family_id | uuid | FK → Family |
| role | enum | `manager` (v1 only value) |
| created_at | datetime | |

### Family
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | e.g. "Ahmed Family" |
| manager_user_id | uuid | FK → User |
| created_at | datetime | |

### Member (a tracked person — NOT a login in v1)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| family_id | uuid | FK → Family |
| name | string | required |
| avatar_type | enum | `preset` \| `photo` |
| avatar_value | string | preset id or photo file path |
| relation | string | e.g. Mother, Son |
| dob_or_age | date/int | store DOB if known, else age |
| gender | enum | male / female / other |
| created_at | datetime | |

### Prescription / Record
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| member_id | uuid | FK → Member |
| photo_path | string | local file (the slip image) |
| doctor_name | string | free text v1 |
| visit_date | date | defaults to today |
| diagnosis_note | string | optional |
| notes | string | optional |
| created_at | datetime | |

### Medicine (many per Prescription)
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| prescription_id | uuid | FK → Prescription |
| name | string | required |
| dosage | string | e.g. "500mg" |
| frequency | string | e.g. "2x/day" |
| duration | string | e.g. "5 days" |

### Doctor (optional, simple text v1 — NOT a directory)
For v1, doctor is just `doctor_name` text on the Prescription. A separate
Doctor entity is deferred until doctor-recommendation feature (Later).

## Relationships
```
User (manager) ──owns──> Family
Family ──has many──> Member
Member ──has many──> Prescription
Prescription ──has many──> Medicine
```

## Required vs Optional (fast entry priority)
- **Required to save a record:** photo OR at least one medicine name, member,
  visit_date (auto = today).
- **Everything else optional** — keep the add form fast (OCR is cut, so typing
  must be minimal-friction).

## Notes for Later
- **Model B (members get own logins)** is a future migration — schema already
  separates User from Member, so adding a nullable `user_id` to Member later is
  clean. No rework needed.
- Structured Medicine rows make v2 AI + search work without OCR.
- Photo stored **locally first** (offline-first); sync/backup strategy = Phase 7.

## Open Questions Carried Forward
- Local DB choice + sync engine → **Phase 7** (tech stack).
- Where photos live (device storage + optional cloud backup) → Phase 7 / 8.
- Encryption of local DB + photos → **Phase 8**.
