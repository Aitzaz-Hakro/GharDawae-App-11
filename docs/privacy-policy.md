# Ghar Dawae — Privacy Policy

**Last updated: 10 October 2026 · Version 2026-10-10**

Ghar Dawae helps you keep your family's medicine records. This page explains
what we store, where it lives, and how you remove it. It is the hosted copy
required by Google Play for health-related apps; the same wording appears inside
the app (Settings → Privacy, and at signup).

---

## What we store

- **Your account:** the email address and password you sign up with. The
  password is stored hashed — we never see or keep it in plain text.
- **Your family members:** name, relation, age, gender, and avatar (a preset
  icon or a photo).
- **Your prescriptions:** the photo of the slip, the doctor's name, the visit
  date, the diagnosis note, and any notes you type.
- **Your medicines:** name, dosage, frequency and duration for each medicine on
  each prescription.

We do not collect your location, your contacts, your device identifiers, or any
analytics about how you use the app.

## Where it lives

Every record is saved **on your phone first**, so the app works with no internet
connection — this is the point of it. When your phone has a connection, a copy
is also synced to our cloud storage so that losing or replacing your phone does
not lose your family's medical history.

## How it's protected

- **On your phone:** the database is encrypted (SQLCipher). Its encryption key
  is held in your device's own secure storage (Android Keystore / iOS Keychain),
  not inside the app.
- **In transit:** all traffic to our servers uses HTTPS.
- **In the cloud:** row-level security means your family's records can only be
  read or written by your own account. Separate families are isolated from one
  another at the database level, not merely by the app asking nicely.
- **Photos:** kept in a private storage bucket. They are never publicly
  reachable; your app requests a short-lived, expiring link when it needs to
  show one.

## Who can see it

Only you. Other users cannot see your records. We do not sell data, we do not
show advertising, and we do not share your records with third parties.

## What we do not do

- No advertising and no ad tracking.
- No selling or renting your data.
- No sending your records to an AI or any external service. If a future version
  adds an assistant that needs to read your records, it will ask for your
  explicit permission first, and you will be able to decline and keep using the
  app without it.

## Deleting your data

Open the app → **Settings** → **Delete my data**. This permanently removes your
family, every member, every prescription, every medicine and every photo, from
both your phone and our cloud storage. It takes effect immediately.

You can also delete individual members and individual prescriptions from their
own screens.

## Children

Ghar Dawae is intended for adults managing their family's records. It is not
directed at children, and we do not knowingly create accounts for children. A
child's medical records may of course be entered by a parent or guardian.

## Your rights

You can access, correct and delete your data at any time from within the app.
If you would like a copy of your data, or have a question about this policy,
contact us at the address below.

## Changes to this policy

If this policy changes materially, the version date at the top will change and
the app will show the updated policy at Settings → Privacy.

## Contact

<!-- TODO: replace with a real support address before publishing to Play -->
**Email:** support@ghardawae.app

---

_This policy is written for Pakistan's Personal Data Protection framework and
PECA. It is a plain-language summary of how the app actually behaves — if the
app and this page ever disagree, the app's behaviour is the bug, and we want to
hear about it._
