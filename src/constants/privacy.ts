// The privacy policy text, in one place so the signup consent screen and the
// Settings page can never drift apart.
//
// Play requires a hosted URL for the store listing (docs/10). The same wording
// should be published as a web page; this constant is the in-app copy.

export const PRIVACY_VERSION = "2026-10-10";

export const PRIVACY_TITLE = "Privacy & your data";

export type PrivacySection = { heading: string; body: string };

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    heading: "What we store",
    body:
      "Your family members (name, relation, age, gender, avatar), the " +
      "prescriptions you add (doctor, visit date, diagnosis, notes), the " +
      "medicines in each prescription, and the photos you take of slips. " +
      "Your email address is used only to sign in.",
  },
  {
    heading: "Where it lives",
    body:
      "Every record is saved on your phone first, so the app works with no " +
      "internet. When you have a connection, a copy is also synced to our " +
      "cloud (Supabase) so you don't lose everything if your phone is lost " +
      "or replaced.",
  },
  {
    heading: "How it's protected",
    body:
      "On your phone, the database is encrypted (SQLCipher) and its key is " +
      "kept in your device's secure storage, not in the app. In the cloud, " +
      "row-level security means your family's records can only ever be read " +
      "or written by your account. Photos are stored in a private bucket and " +
      "are only reachable through short-lived links your app requests.",
  },
  {
    heading: "Who can see it",
    body:
      "Only you. No one else can see your family's records — not other " +
      "users, and not the app's developers through the normal app.",
  },
  {
    heading: "What we don't do",
    body:
      "We don't sell your data, we don't show ads, and we don't send your " +
      "records to any AI or third-party service. If a future version adds an " +
      "assistant that needs to read your records, it will ask your explicit " +
      "permission first and you will be able to say no.",
  },
  {
    heading: "Deleting your data",
    body:
      "Settings → Delete my data removes your family, every member, every " +
      "record and every photo from both this phone and our cloud storage. " +
      "It is immediate and permanent.",
  },
];
