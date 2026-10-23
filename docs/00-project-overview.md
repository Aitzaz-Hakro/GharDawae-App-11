# Ghar Dawae — Project Overview

> **One-liner for the demo video:**
> **Ghar Dawae keeps your family's medicines, prescriptions and doctor visits safe, searchable and always available — even with no internet.**

---

## 1. What it is

Ghar Dawae ("home medicine" in Urdu) is an **offline-first family medicine
cabinet** for one caretaker managing the health records of the people they look
after.

One manager signs in. Every family member — Ammi, Baba, the kids — is a record
in that manager's cabinet, never a separate account. Each person gets their own
prescriptions, medicines, doctor visits and photos.

The app is built for the moment that matters: standing at the pharmacy counter,
phone in hand, needing to know **"what did the doctor give Ammi last time?"**
That answer must appear immediately, without waiting for a network.

---

## 2. The problem

Families often keep prescriptions in drawers, WhatsApp photos, or nowhere at
all. When a doctor asks what was prescribed last time, the information is
missing or unreadable.

A cloud-only app makes this worse: the pharmacy basement has no signal, and an
elderly parent may not be able to navigate a complex clinical interface.

Ghar Dawae solves that with three rules:

1. **Local first.** Every read and write goes to encrypted SQLite on the phone.
2. **Fast entry.** A record can be a photo, a few typed medicines, or both.
3. **Calm design.** Large tap targets, plain language, warm colours, and no
   hospital-style clutter.

---

## 3. What makes it different

- **Works in airplane mode.** The family list, records and search never wait on
  the network. The cloud is a backup, not the source of truth.
- **One family, one account.** The manager owns the data; members are records,
  not logins.
- **Two AI paths, with a human in control.** The assistant can read a
  prescription or explain a food question; the prescription reviewer extracts
  medicines into a form the caretaker must check and save. AI never saves a
  record on its own.
- **A care-first interface.** The Eldora-inspired redesign includes a daily
  wellness check-in, a five-tab shell, a care-coverage ring built from real
  records, and a keyboard that can always be dismissed.

---

## 4. Suggested 60-second demo script

| Time | Screen | What to say / do |
|---|---|---|
| 0–5s | Welcome | "Ghar Dawae keeps a family's medicines in one calm, offline place." Tap **Get started**. |
| 5–15s | Home | Show the greeting, daily wellness check-in, and the six shortcuts. |
| 15–30s | New record | Pick a member, photograph a prescription, let the AI read it, review the extracted medicines, then tap **Save**. |
| 30–40s | Health | Show care coverage, real counts, recent medicines and the daily tip. |
| 40–50s | Family | Show the avatar row, member cards and care notes. |
| 50–60s | Search / offline | Turn on airplane mode, search a medicine, open the record. "Still works — because the phone is the source of truth." |

The one sentence to open or close the video:

> **Ghar Dawae keeps your family's medicines, prescriptions and doctor visits safe, searchable and always available — even with no internet.**

---

## 5. Feature tour

### Welcome and authentication
- Brand welcome screen with a warm hero illustration, three benefits, value
  cards, and clear **Get started** / **Sign in** actions.
- Manager-only email/password authentication through Supabase.
- Signup requires explicit consent to the privacy policy.
- Returning users with a session go straight to the Home dashboard.

### Home
- Time-aware greeting for the manager.
- Daily wellness check-in stored privately on the device.
- Six responsive shortcuts: Health, Medicines, New record, Family, Search,
  Services.
- Real family cards with prescription counts.
- Latest prescription card with medicine chips.
- Member picker before creating a record, so a prescription always has an owner.
- Pull-to-refresh and a floating **New record** action.

### Health
- **Care coverage** ring: the share of family members with at least one
  prescription on file. It is derived from real records, not a clinical score.
- Real totals: members, prescriptions, medicines and last visit.
- Health insights built only from data that exists.
- Recent medicines with member and visit context.
- A daily non-diagnostic wellness tip.

### Family (Connect)
- Avatar row with an explicit **Add** target.
- Member list with relationship, age and record count.
- **Care notes** pulled from real diagnosis/note fields.
- No fake messages, calls or community features.

### Services
- New prescription record.
- OpenAI-powered AI assistant.
- All medicines, search, and add-member actions.
- Privacy, settings and profile shortcuts.
- Live backup status.

### Profile
- Manager identity and family totals.
- Backup status and last-sync time.
- Privacy, settings and logout.
- No destructive action without confirmation.

### Records, medicines and search
- Camera-first capture plus a manual entry fallback.
- The medicine grammar is consistent everywhere:
  **name · dosage · frequency · duration**.
- Visit history is ordered by visit date.
- Offline search across members, prescriptions, doctors, notes and medicines.
- All Medicines groups every medicine by family member.

### AI Assistant and ParchiiAI
- **Assistant:** chat-style help for medicine and food questions, with text and
  photo input. It uses OpenAI Chat Completions (`gpt-4o-mini` by default).
- **ParchiiAI:** a prescription-review drawer that extracts doctor, date,
  medicines and multilingual caregiver explanations. It opens for review and
  never writes to the database by itself.
- Uncertain handwriting is flagged for pharmacist confirmation.
- The app is explicit that AI is supportive, not a diagnosis or a prescribing
  service.

---

## 6. How it is built

### Architecture at a glance

```
Expo React Native UI
        │  reads and writes are instant
        ▼
Encrypted SQLite on the phone  ← source of truth
        │  background push / pull when online
        ▼
PowerSync client
        │
        ▼
Supabase: Auth · Postgres · Storage  ← cloud backup
```

**Golden rule:** the UI never waits on the network. Supabase is only touched
directly for authentication, photo upload/signing, and account deletion.

### Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 57 (managed), React Native 0.86.3, React 19.2.3 |
| Language | TypeScript strict |
| Routing | Expo Router (file-based, typed routes) |
| Local database | `@op-engineering/op-sqlite` through PowerSync, SQLCipher encrypted |
| Encryption key | `expo-secure-store`, generated once with `expo-crypto` |
| Cloud | Supabase (Postgres, Auth, Storage) |
| Sync | PowerSync, family-scoped sync rules |
| AI provider | OpenAI Chat Completions / Vision (`gpt-4o-mini`, `gpt-4o`) |
| UI | Custom Warm Cabinet + Eldora care tokens, `react-native-svg`, no UI kit |
| State | React context for auth and language; local state everywhere else |

### Data model

```
families 1──n members 1──n prescriptions 1──n medicines
```

- `families` — the manager's family.
- `members` — name, avatar, relation, age, gender.
- `prescriptions` — member, photo, doctor, visit date, notes.
- `medicines` — prescription, name, dosage, frequency, duration.

Every table is protected by row-level security in Supabase. Local rows are
encrypted with SQLCipher. IDs are minted on the device so a record can be
created offline before the cloud ever sees it.

### Photos

A prescription has two photo fields on purpose:

- `photo_path` — the local file name, used immediately and offline.
- `photo_url` — the object key in the private Supabase Storage bucket.

The UI prefers the local file and falls back to a signed URL. That is what makes
a reinstall or a second device work.

### AI configuration

The app reads:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=...     # required for live AI
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini
# EXPO_PUBLIC_OPENAI_ENDPOINT=...  # optional override
```

The ParchiiAI adapter also supports Gemini or a serverless proxy, but OpenAI is
the configured provider in this build. The assistant's provider seam lives in
`src/lib/ai/gemini.ts` (the filename is historical; it now talks to OpenAI).

### Safety boundaries

- AI only **pre-fills** the record form; the caretaker reviews and taps Save.
- Unclear handwriting is flagged, not guessed silently.
- The app never diagnoses, never tells someone to stop a medicine, and never
  presents a wellness score as a clinical result.
- Emergency symptoms are directed to urgent medical care.
- AI suggestions are labelled as supportive, not a replacement for a
  pharmacist or doctor.

### Privacy and security

- Local SQLite is encrypted with a key stored in Secure Store.
- RLS scopes every cloud row to the manager's family.
- The photo bucket is private; object keys are scoped by family.
- The privacy policy is readable before an account is created.
- Account deletion removes local and cloud data after two confirmations.

### Design system

The app uses one token file (`src/constants/theme.ts`):

- Warm ivory canvas, off-white cards, deep green for the single primary action.
- Peach, mint and tan surfaces for care accents, never for primary buttons.
- Pill actions, 44px minimum tap targets, readable body sizes.
- One line-icon family (Phosphor geometry embedded in `Icon.tsx`).
- Calm entrance and press motion, with reduced-motion support.
- Dark mode is designed from the same tokens, not inverted on the fly.

### Keyboard and accessibility

- Shared `KeyboardAwareScroll` form shell with an explicit **Done** bar.
- Drag-to-dismiss, tap-to-dismiss, and keyboard-aware scrolling.
- The bottom tab bar hides while the keyboard is open.
- Focused fields get a visible border; form errors are inline and announced.
- Every icon-only control has an accessibility label and role.
- The score ring exposes a textual value and explanation to screen readers.

---

## 7. Project structure

```
src/
  app/                    # Expo Router routes
    (auth)/               # welcome, login, signup
    (main)/
      (tabs)/             # Home, Health, Family, Services, Profile
      member/             # new, detail, edit
      record/             # camera, new, detail
      search.tsx
      medicines.tsx
      assistant.tsx
      settings/           # settings, privacy
  components/             # shared UI, icons, illustrations
    ui/                   # care design primitives
  constants/              # theme, avatars, privacy copy
  lib/                    # local data access, auth, sync, AI
    powersync/            # database, schema, connector, sync
    ai/                   # assistant, ParchiiAI, prompts, validation
db/                       # Supabase SQL (schema, RLS, storage)
docs/                     # product, architecture, design, launch docs
scripts/                  # preflight, AI smoke test
```

### Where to look first

| Question | File |
|---|---|
| What are the colours, type and spacing? | `src/constants/theme.ts` |
| How is a record saved? | `src/components/RecordForm.tsx` → `src/lib/records.ts` |
| How does offline sync work? | `src/lib/powersync/` |
| How does the assistant call OpenAI? | `src/lib/ai/gemini.ts` |
| How does ParchiiAI validate output? | `src/lib/ai/service.ts`, `validator.ts` |
| How is the family data protected? | `db/rls.sql`, `docs/08-security.md` |
| What was the design brief? | `docs/design inspiration/eldora_react_native_design_spec.md` |

---

## 8. Running it

### Prerequisites

- Node 20+
- A real Android phone
- An Expo development build (needed for SQLite, camera and secure storage)

### Environment

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POWERSYNC_URL=
EXPO_PUBLIC_OPENAI_API_KEY=
```

### Commands

```bash
npm install
npx expo start                 # Metro
npx expo run:android           # local native build
npx tsc --noEmit               # typecheck
npm run lint                   # lint
npm run preflight              # pre-launch checks
```

The mic button in the assistant needs a development build that includes
`expo-audio`. A JS-only reload on an older build still boots: the assistant's
audio import is guarded, and text/photo chat continues to work.

---

## 9. Quality gates

Before calling the project done:

- `npm run typecheck` passes with strict TypeScript.
- `npm run lint` passes.
- `npx expo export --platform android` produces a bundle.
- The app opens offline, and a family member's records can be read with the
  network off.
- Adding a prescription with a photo or a medicine still works end to end.
- The keyboard can always be dismissed, and the tab bar never covers an input.

There is no automated test runner or CI in this repository. The AI smoke test is
`npm run test:ai`; the launch checklist lives in `docs/m7-launch-pack.md`.

---

## 10. Known constraints and honest next steps

- **The mic needs a rebuild.** `expo-audio` is a native module; the installed
  dev client may predate it. The guarded import keeps the app bootable.
- **The AI key is client-embedded.** `EXPO_PUBLIC_OPENAI_API_KEY` is a
  demo-scoped key. For production, route requests through a serverless proxy and
  keep the real key server-side.
- **Manager-only accounts.** Family members are records, not logins. Multi-login
  households are out of scope for v1.
- **No automated tests or CI yet.** Typecheck, lint and the on-device checklist
  are the current gates.
- **iOS is deferred.** The app is Android-first; the same Expo codebase can be
  built for iOS later.

---

## 11. Submission summary

**Ghar Dawae is a working, offline-first family medicine cabinet with a calm
care interface, encrypted local records, cloud backup, and two AI helpers that
assist without ever taking control away from the caretaker.**
