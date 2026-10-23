# Ghar Dawae — Phase 8: Security & Privacy

_Last updated: 2026-09-26_

> Health data is the most sensitive category. These are v1 minimums, not
> optional. Decisions below are locked; deferred items are marked.

## Decisions
- **Local DB encryption: YES — SQLCipher** (encrypted SQLite at rest).
- **Biometric unlock: NO for v1** — password login only. (Revisit v2.)
- **Photo encryption: NO for v1 — OS app-sandbox is enough.** (Revisit if
  users store highly sensitive images; encrypt then.)

## 1. Local Data at Rest
- **SQLCipher** encrypts the local SQLite DB (all medical records).
- **Encryption key** stored in device secure storage
  (`expo-secure-store` → Android Keystore / iOS Keychain). Key never in plaintext,
  never in the DB, never in code.
- **Prescription photos:** rely on OS app-sandbox isolation for v1 (other apps
  can't read them). Full file encryption deferred.

## 2. Auth (manager only, v1)
- Supabase Auth: email/phone + password.
- **Password hashing** handled by Supabase (never store plaintext).
- Password rules: enforce a sane minimum (length + basic strength).
- Email/phone verification: recommended (reduces junk accounts).
- **No biometric unlock v1** (deferred).

## 3. Cloud Security (Supabase)
- **Row-Level Security (RLS) = MANDATORY.** Every table policy: a manager can
  read/write ONLY rows belonging to their own `family_id`. Without RLS any
  logged-in user could read every family's records. This is the single most
  important cloud control.
- **HTTPS/TLS** in transit = default, enforced.
- Supabase Storage (photos): private bucket, access scoped per family via
  signed URLs / RLS-equivalent policies.

## 4. Sync Security (PowerSync)
- Syncs only the authenticated manager's own family data (driven by the same
  RLS / auth token).
- No cross-family data ever leaves the device or arrives from cloud.

## 5. Privacy & Legal (Pakistan)
- Applicable: **PECA** + upcoming **Personal Data Protection Bill** (lighter
  than GDPR today, tightening soon — build as if it applies).
- v1 must ship with:
  - **Privacy policy** (what's stored, where, how protected).
  - **User consent** at signup.
  - **Data deletion** — manager can delete family data (local + cloud).
- **v2 AI:** sending records to a cloud LLM = **explicit separate consent**
  required (noted in Phase 5).

## Security Checklist (v1 must-haves)
- [ ] SQLCipher on local DB, key in secure storage
- [ ] Supabase RLS policies on every table (family-scoped)
- [ ] Private photo bucket, scoped access
- [ ] HTTPS everywhere (default)
- [ ] Password hashing (Supabase default)
- [ ] Privacy policy + consent + data-delete

## Deferred (post-v1)
- Biometric unlock.
- Full photo-file encryption.
- Advanced: audit logs, 2FA.

## Open Questions Carried Forward
- Exact PowerSync ↔ Supabase Auth token wiring → during build.
- Who hosts the privacy policy (in-app + web page) → Phase 10 (launch).
