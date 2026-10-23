# Ghar Dawae — Design System

_Last updated: 2026-10-22_

**Direction: Warm Cabinet.**
The app is a wooden medicine cabinet in a warm kitchen: cream paper, deep green
for the one thing you press, and a fixed colour for every person in the family.
The colour is carried by the people, not by decoration. Nothing glows, nothing
floats, nothing looks like a hospital.

`src/constants/theme.ts` is the executable copy of this document. When the two
disagree, this document is the source of truth and the code is the defect.

---

## 1. Thesis

> Ghar Dawae is the family's cabinet — one colour per person, one date you
> trust, one medicine line you can read at the pharmacy counter — so a
> caretaker feels *"our house is in my pocket"* before the app finishes
> opening.

A stranger should recognise, in five seconds, that this is **one family's**
records, and which person a record belongs to before reading a word.

## 2. Why this direction

Four structures were derived from the content first (roster strip + ruled lines;
portrait wall; search-first; polish-only). That exercise produced **The Ledger**:
a ruled, date-anchored document with a single medicine line. It was correct
about hierarchy and wrong about warmth — the ruled lines read like a printout,
and the family had no visual identity beyond their initials.

**Warm Cabinet** is the exploration that fixed exactly that, generated against
the Sleek mobile design tool and reviewed screen by screen
(`docs/design-explorations/warm-cabinet/`). It keeps The Ledger's hierarchy —
the visit date is still the largest thing on a record, the medicine is still one
line — and adds:

- a cream paper base instead of white,
- a solid colour per person, carried from the family grid into their record
  blocks,
- a 6px coloured edge on every record, so a family's history stays recognisable
  when scanned in a list,
- a warm brown-black night mode instead of a blue-grey one.

### Exit criteria for the review

1. Structure, spacing, colour and type come from the reviewed screens exactly.
   That output is the spec, not a mood board.
2. Content is placeholder. Every string on those screens was replaced with real
   data from SQLite. No mockup literal ships.
3. No generated prescription photographs. Only real captures.
4. The medicine line stays one grammar across every surface (§6).
5. Tokens only. Every text pair re-measured (§4). Dark mode designed here —
   the exploration was light-only.
6. Explicit `flexDirection` on every row; safe-area insets respected; every
   string inside `<Text>`.

## 3. Design principles

In priority order: **Calm. Trustworthy. Fast.**

| Principle | What it means in code |
|---|---|
| Calm | One action colour (`primary`). No gradient, no shadow, no glow. `accent` is a green *surface*, never a button. |
| Trustworthy | The date is the largest element on a record. Missing facts print an em dash — never a blank that could be read as "none". |
| Fast | Offline-first: every screen reads SQLite directly. Fonts load behind a gate that falls back to system type rather than blocking. |

## 4. Colour

### Light — cream paper, deep green

| Token | Hex | Use | Measured |
|---|---|---|---|
| `background` | `#F7F1E6` | screen base | — |
| `surface` | `#FFFBF3` | cards, record blocks | — |
| `surfaceSelected` | `#EFE8D9` | chips, medicine wells | — |
| `input` | `#FFFDF8` | text fields | — |
| `border` | `#DCD2BE` | card and field borders | 1.33:1 vs background (decorative) |
| `primary` | `#2F6B4F` | the one action colour | 6.29:1 with white · 5.60:1 vs background |
| `primaryPressed` | `#255840` | pressed action | — |
| `accent` | `#DCEBE0` | calm green *surface* | — |
| `text` | `#1E2A32` | primary ink | 13.04:1 vs background · 14.20:1 vs surface |
| `textSecondary` | `#5A6370` | labels, meta | 5.41:1 vs background · 5.89:1 vs surface · 4.98:1 vs chip |
| `onPrimary` | `#FFFFFF` | ink on the action colour | 6.29:1 |
| `onAccent` | `#1F4D38` | ink on the accent surface | 7.81:1 |
| `danger` | `#B3261E` | destructive only | 6.33:1 vs surface |
| `warningSurface` / `warningText` | `#F7E7C6` / `#6B4A0C` | pending-backup banner | 6.59:1 |
| `infoSurface` / `infoText` | `#DDEBE8` / `#1F4D48` | syncing banner | 7.74:1 |

### Dark — warm night, not blue-grey

| Token | Hex | Measured |
|---|---|---|
| `background` | `#14120E` | — |
| `surface` | `#1F1B15` | — |
| `surfaceSelected` | `#2A251C` | — |
| `input` | `#191510` | — |
| `border` | `#3A3327` | 1.50:1 vs background (decorative) |
| `primary` | `#5FAE85` | 7.02:1 vs background · 6.43:1 vs surface |
| `accent` | `#22352A` | — |
| `text` | `#F5EFE3` | 16.34:1 vs background · 14.96:1 vs surface |
| `textSecondary` | `#B4AB9A` | 8.22:1 vs background · 7.53:1 vs surface · 6.69:1 vs chip |
| `onPrimary` | `#0E1F16` | 6.43:1 on primary |
| `onAccent` | `#A9D8BC` | 8.22:1 on accent |
| `danger` | `#F28B82` | 7.17:1 vs surface |
| `warningSurface` / `warningText` | `#33280F` / `#F0C97A` | 9.19:1 |
| `infoSurface` / `infoText` | `#1B2A33` / `#A7CBE0` | 8.60:1 |

Rules:

- Body text is never below 16sp. Meta is 14sp; 12sp is reserved for a caption
  that is never load-bearing.
- A colour is chosen by token, never by hex, inside a screen.
- Anything below 4.5:1 is decoration and must not carry meaning.

## 5. Type

Two families, six files, one family per weight:

| Role | Family | Size |
|---|---|---|
| Display — screen title | `NunitoSans_800` | 28 |
| Title — section header | `NunitoSans_700` | 22 |
| Heading — card title, button label | `NunitoSans_600` | 18 |
| Body | `SourceSans3_400` | 16 |
| Body medium — emphasis inside body | `SourceSans3_600` | 16 |
| Label | `SourceSans3_400` | 14 |
| Caption | `SourceSans3_400` | 12 |
| Record date | `NunitoSans_800` | 30, tabular |

Android synthesises bold badly: asking a 700 file for `fontWeight: 700`
thickens it twice. Every style therefore names a **loaded family** and never a
weight. Fonts are loaded with `useFonts`; a font failure falls back to system
type rather than blocking the offline path.

Dates use `fontVariant: ["tabular-nums"]` so a column of visits aligns.

## 6. The medicine grammar

A medicine is always the same four facts in the same order:

**name · dosage · frequency · duration**

Density changes with the surface; the facts and their order never do.

| Surface | Form | Component |
|---|---|---|
| Record block (member screen) | chip: `Amlodipine 5mg` | `MedicineChip` |
| Record detail | card: name + duration, then two labelled wells (Dosage, Frequency) | `MedicineCard` |
| Search hit | name, then `5mg · twice daily · 7 days` | inline row |
| Entry form | one row of three inputs under the name | `RecordForm` |

A caretaker learns the object once and reads it everywhere.

## 7. Cabinet metrics

| Token | Value | Use |
|---|---|---|
| `gutter` | 20 | outer screen padding |
| `cardRadius` | 20 | family cards, photos |
| `blockRadius` | 18 | record blocks, medicine cards, inputs |
| `edgeWidth` | 6 | person colour on a record block |
| `gap` | 12 | between cards and grid columns |
| `rule` | hairline | inner dividers |
| `touchTarget` | 44 | minimum tappable |
| `actionHeight` | 56 | primary button |
| `bottomInset` | 96 | clearance under a floating action |

Every row sets `flexDirection` explicitly. Screens use
`SafeAreaView`/`useSafeAreaInsets`; bottom padding is `bottomInset + inset`.

## 8. Avatars

DiceBear **Open Peeps** illustrated portraits on a solid person colour — not
emoji or initials. Eight replaceable SVG files ship in `assets/avatars/`; the
existing `expo-image` component renders them without a runtime request.
Artwork is by Pablo Stanley under CC0. Download settings and individual links
live in `assets/avatars/README.md`.

Portraits use natural skin tones, cream/pale-green/beige clothing, and warm dark
hair. The canvas is transparent: the app draws the circle and the selected ring.
No gender, age, relation or name determines which portrait a member receives;
the user chooses a preset. Eight fills remain identical in both schemes, each
verified ≥4.5:1 with white fallback ink:

| id | fill | ratio |
|---|---|---|
| clay | `#B65C3F` | 4.57 |
| sand | `#966F21` | 4.57 |
| teal | `#38807C` | 4.62 |
| lilac | `#8A5A9E` | 5.20 |
| rose | `#C24E75` | 4.53 |
| sage | `#5A7F55` | 4.56 |
| sky | `#467BA5` | 4.53 |
| slate | `#6B7280` | 4.83 |

The tint follows a person from the grid to their record edge. A person's colour
must not change when the phone switches to dark. Stored emoji ids from before
this change still resolve through `LEGACY_EMOJI_TO_TINT`.

Replacing `<tint-id>.svg` changes that shared preset's picture, not its stored
identity or record colour. A decode failure shows a small vector person, never
letters. Existing photo avatars still render as photos. Check portraits at
40/48/64/80px in both schemes; vector art is decorative and the member's name
remains the accessible identity.

## 9. Icons

Phosphor, embedded as SVG paths in `src/components/Icon.tsx` and rendered with
`react-native-svg`. No runtime fetch: the icons must draw on the first frame,
offline. Icons are accessibility-hidden — the label lives on the pressable.
Never render a glyph character (`＋`, `✕`, `⚙︎`, `›`) as UI: it renders as tofu
on a missing font.

## 10. Surfaces

- **Family grid** — two columns; each card is a 64px avatar, name, and live
  prescription count. Counts come from one grouped query (`prescriptionCounts`),
  not N queries.
- **Record block** — cream card, 6px person edge, "Visit date" label, 30px date,
  doctor, medicine chips.
- **Banner** — sync state only, rounded, tinted surface. Offline is never an
  error.
- **Empty state** — one sentence of plain copy and the action that fixes it.

## 11. Motion

Press feedback is an opacity change (`0.8`), 0 ms to enter, nothing that delays
the next screen. The app is used at a pharmacy counter; it must feel like it was
already open.

## 12. Open items

- Render gate: every screen in light and dark against
  `docs/design-explorations/warm-cabinet/*-review.png`.
- `react-native-svg` is a new native module — the installed APK must be rebuilt.
- Contrast was measured for the pairs above; re-measure after any palette edit.
