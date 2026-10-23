# M7 — Launch pack (Google Play)

_Last updated: 2026-10-10_

Everything needed to publish v1, in the order it has to happen. Check items off
as they're done. Nothing here is code — it's the paperwork around the code.

---

## 1. Privacy policy must be live at a URL

Play requires a **publicly reachable URL** for a health-data app. The text is
written and in-repo at `docs/privacy-policy.md`.

**Do this:**
1. Push this repo to GitHub (already done — `Aitzaz-Hakro/GharDawae-App`).
2. In the repo: **Settings → Pages → Source: main branch, /docs folder → Save**.
3. GitHub publishes it at `https://aitzaz-hakro.github.io/GharDawae-App/privacy-policy`
   (allow a few minutes for the first build).
4. Open that URL in a private window to confirm it loads without signing in.
5. **Replace the placeholder support email** in `docs/privacy-policy.md` with a
   real address before submitting. Play reviewers do check contact details.

That same URL goes in **two** places on Play: the store listing, and the Data
Safety form.

## 2. Google Play Console

- [ ] Create a Play Console account (one-time ~USD 25) at
      play.google.com/console.
- [ ] Choose **Personal** or **Organisation** account. Personal accounts created
      recently must run a closed test with 12+ testers for 14 days before
      production — budget for that; it is the most common launch surprise.
- [ ] Create the app: name **Ghar Dawae**, default language English (Pakistan).

## 3. Data Safety form

Play treats health apps with extra scrutiny. Answer honestly — a mismatch with
observed behaviour gets the app rejected.

| Question | Answer |
|---|---|
| Does your app collect or share user data? | **Yes** (collects; does not share) |
| Data types collected | Personal info → **Email address**; Health and fitness → **Health info**; Photos and videos → **Photos** |
| Is data encrypted in transit? | **Yes** (HTTPS) |
| Can users request data deletion? | **Yes** — in-app, Settings → Delete my data |
| Is data shared with third parties? | **No** |
| Is data used for advertising or tracking? | **No** |

Also complete **Health apps declaration** when prompted: records are
user-entered, for personal record-keeping, not diagnosis or treatment advice.

## 4. Store listing

- [ ] **App name:** Ghar Dawae
- [ ] **Short description** (≤80 chars) — draft:
      `Your family's medicine records, kept safe — and working without internet.`
- [ ] **Full description** — draft:

  > Prescriptions get lost. The slip goes in a drawer, the follow-up visit
  > comes, and nobody remembers what was given last time.
  >
  > Ghar Dawae keeps every prescription for every person you care for — Ammi,
  > Baba, the kids — in one place on your phone.
  >
  > • Photograph a slip and add the doctor, date and medicines in seconds
  > • Find any medicine or doctor instantly — **with no internet at all**
  > • See each family member's full visit history
  > • Everything is encrypted on your phone and backed up privately
  >
  > Built for Pakistan, where the internet drops when you need it most.
  > Your records never leave your account, and nobody else can see them.

- [ ] **Screenshots:** at least 2 phone screenshots (Play wants 4+ for a good
      listing). Best four, in the order they tell the story:
      1. Family grid with members
      2. A member's visit history
      3. A record detail with the slip photo + medicine list
      4. Search results for a medicine
- [ ] **Feature graphic:** 1024×500 PNG.
- [ ] **App icon:** 512×512 PNG (Play rejects transparency in some slots).
- [ ] **Category:** Medical
- [ ] **Content rating:** complete the questionnaire — it will land on
      Everyone / PEGI 3 with no ads.
- [ ] **Contact details:** email + (optionally) a website showing the policy.

## 5. Production build and rollout

- [ ] Set a real `version` in `app.json` (currently `1.0.0` — fine for v1).
- [ ] Build the store artifact:
      `npx eas-cli@latest build -p android --profile production`
      (`.aab`, `autoIncrement` on, so version codes take care of themselves).
- [ ] Upload to Play Console → **Internal testing** first, install from the Play
      link yourself, verify sign-in and a full offline record flow on the real
      device that has Play services.
- [ ] Promote to **Closed testing** with your 3–5 families (docs/10 Phase B).
- [ ] After the required testing window, promote to **Production** with a staged
      rollout (start at 20%).

## 6. Beta test plan (docs/10 Phase A + B)

- [ ] **Phase A — own family.** Use it for real. This is where you catch the
      embarrassing breaks: a camera that won't focus on a real slip, a medicine
      name that autocompletes wrong, sync that quietly stops.
- [ ] **Phase B — 3–5 friendly families.** Give them the closed-testing link.
      Watch two things above all:
      - Does adding a record feel fast enough that they don't avoid it?
      - When they need a medicine with no internet, does it actually work?
- [ ] Ask each tester the same short set of questions, so answers are
      comparable. Suggested:
      1. Did adding your first record feel easy or annoying?
      2. Did you ever open it and not find what you expected?
      3. Would you trust it with your family's real records? Why / why not?

## 7. Feedback channel

- [ ] Stand up one channel before the first tester gets the link — a WhatsApp
      number or a dedicated email. Not a form: caretakers reply to messages.
- [ ] Track what comes back as: **crash**, **sync failure**, **entry friction**,
      or **feature request**. Feed the first three straight back into the build.

## 8. Pre-launch verification

Run these on the production build on a real, low-end Android phone — the
Pakistan target device, not your own.

- [ ] Airplane mode → open app → family grid → member → record detail. Fully
      offline, no error screens, no spinners that never end.
- [ ] Airplane mode → add a full record → close the app → reopen → the record is
      still there.
- [ ] Turn the network back on → the record reaches Supabase (check the table in
      the dashboard).
- [ ] Sign in as a **second** account on a second device → it cannot see the
      first family's data. This is the security claim; verify it, don't assume.
- [ ] Settings → Delete my data → signed out, and the Supabase tables are empty
      for that family.
- [ ] App icon, name and splash all look right on the home screen and in the
      app switcher.

## Open items

- **Support email** — placeholder in the policy; must be real before submitting.
- **Feature graphic** — not designed yet (the icon/splash come from Design Day).
- **iOS** — deferred for v1 (docs/10). Nothing here is Android-specific except
  the build profile.
