# Ghar Dawae — Design System

_Last updated: 2026-10-18_

**Direction: The Ledger.**
A caretaker under pressure does not browse — they recall. The app is the
household's medicine ledger: ruled lines, one date you trust, one medicine
line you can scan in a glance. Warmth comes from copy and colour, not from
decoration; speed and legibility are the brand.

This doc locks the visual + interaction direction. `src/constants/theme.ts` is
the executable copy; when the two disagree, this doc is the source of truth and
the code is the defect.

---

## 1. Thesis

> Ghar Dawae is the family's medicine ledger — ruled lines, one date you trust,
> one medicine line you can scan in a glance — so a caretaker at a pharmacy
> counter feels *"it's already here"* before the app finishes opening.

A stranger should recognise, in five seconds, that this is **one family's**
records and that **a medicine is one line away**.

## 2. Why this structure (candidate record)

Four materially different structures were derived from the content, not from a
template shelf. All four kept teal + coral and system fonts, so the comparison
was structural.

| # | Direction | Structure | Verdict |
|---|-----------|-----------|---------|
| 1 | **The Ledger** | Roster strip + ruled, date-anchored medicine lines; one shared line object across every surface | **Chosen** |
| 2 | The Wall of Faces | Portrait-first family wall, photo plates, album pages | Rejected: the photo is a blurry handwritten slip, not a portrait; hero emoji-scale tokens read as a toy; heaviest on the low-end target |
| 3 | The Counter | Search field as home, roster demoted, recent medicines promoted | Rejected: fastest for lookup but destroys family identity and the add flow's anchor |
| 4 | Polish current only | Fix contrast, migrate defaults, no signature device | Rejected: leaves three unrelated grammars for the same datum |

**Excluded category default:** clinical blue SaaS dashboard (oladoc / Marham
pattern). Deliberately excluded — looking different is positioning. The content
does not earn it: there is no hospital workflow here, only a household.

The Ledger won because the mechanism is **recall under pressure**, not
browsing. A ledger is also the object this audience already trusts (the
prescription slip itself, the vaccination card, the school diary).

## 3. Design principles

Three words, in priority order: **Calm. Trustworthy. Fast.**

- **Calm** — one clear action per screen, generous whitespace, no competing
  signals. The feel is an organised medicine cabinet, not a hospital portal.
- **Trustworthy** — this holds a family's medical records. Solid, honest,
  stable. Warmth of a family keepsake over the cold of a clinical EMR.
- **Fast** — Journey 2 (3-tap offline lookup) is sacred. Nothing visual may
  slow app open, screen transition, or the family grid.

Guard: if a choice competes with any of the three, the choice loses.

### Still rejected (carried forward, now with reasons recorded)
- **3D anywhere** — low-end Android is an explicit target; motion for its own
  sake is the enemy of fast.
- **Decorative animation** — an animation must explain a state change or it is
  cut.
- **Onboarding carousel** — the empty family grid is the onboarding.
- **Bundled font files** — system fonts keep cold start free. Warmth is
  delivered by copy ("Ammi, Baba, the kids"), not by a display face.

## 4. The signature device: the medicine line

One line, one order, every surface:

```
Panadol 500        1 tab     8h      3d
└ name            └dose   └freq   └duration
```

- The name grows; the three detail columns are `tabular-nums`, right-aligned,
  and show an em-dash when empty. Position is the meaning — a caretaker reads
  by column after the first row.
- The same component (`MedicineLine`) renders on the member screen, in search
  results, and inside a record. New surfaces must reuse it; a second grammar
  for a medicine is a defect.
- A record is a **dated block**: the date and doctor sit above a hairline rule,
  with the slip's thumbnail on that rule's right edge
  (`LedgerRecord`). Blocks stack like entries in a ledger, not like cards.

**One signature interaction:** pressing anywhere in a dated block or on a
medicine line opens that record. No nested controls inside a ledger row (a
nested target breaks the promise that the rhythm of the rows is the tap map).

### Derived metrics (`Ledger` in theme.ts)
| Token | Value | Use |
|-------|-------|-----|
| `rule` | `StyleSheet.hairlineWidth` | every rule under a date, every row divider |
| `medicineRowMinHeight` | 44 | tap target floor for a medicine line |
| `columnGap` | 12 | gap between name and the detail trio |

## 5. Colour

Roles first; values second.

- **Primary — teal.** Medical trust without hospital sterility; green reads
  positive in South Asia. Used for actions, links, active states.
- **Accent — coral.** Reserved for **create** actions only (the add FAB), plus
  the cross in the app mark. Corals behind white text fail contrast, so the
  accent's ink is `onAccent` (near-black).
- **Danger — red, precious.** Delete / destructive only. Never decorative. In a
  medical app red must always mean danger.
- **Status surfaces** are their own tokens (`warningSurface`, `infoSurface`)
  with paired text tokens, so a banner never invents a colour.
- **Neutrals** — text, surfaces, borders.

### Values (verified, not proposed)

Light:

| Token | Hex | Contrast on its use | Use |
|-------|-----|---------------------|-----|
| primary | `#0C7C70` | 5.08:1 with white | buttons, links, active |
| primaryPressed | `#0A665C` | — | pressed |
| accent | `#F2764E` | 6.62:1 with `onAccent` | create FAB |
| accentPressed | `#DD5F38` | — | FAB border / pressed |
| onAccent | `#111417` | 6.62:1 on accent | ink on coral |
| background | `#FFFFFF` | — | screen base |
| surface | `#F6F7F8` | — | cards, inputs, marks |
| surfaceSelected | `#E6E8EB` | — | chips, selected |
| border | `#E2E5E9` | — | rules, dividers |
| text | `#111417` | 18.1:1 on white | primary text |
| textSecondary | `#5B6168` | 6.5:1 on white | labels, meta |
| danger | `#C23B3B` | 5.25:1 with white | destructive |
| success | `#2E9E6B` | fill only | icons/marks |
| successText | `#1F7A50` | 5.0:1 on white | success text |
| warningSurface / warningText | `#FFF4E0` / `#7A4F0A` | 7.0:1 | pending-backup banner |
| infoSurface / infoText | `#EAF3FE` / `#1E4C82` | 8.2:1 | syncing banner |

Dark:

| Token | Hex |
|-------|-----|
| primary | `#2DD4BF` |
| primaryPressed | `#14B8A6` |
| accent | `#FF8A5E` |
| onAccent | `#1A0F08` |
| background | `#0C0E10` |
| surface | `#17191C` |
| surfaceSelected | `#23262A` |
| border | `#2A2E33` |
| text | `#F2F4F6` |
| textSecondary | `#A4ABB3` |
| onPrimary | `#06201C` |
| danger | `#F26A6A` |
| success / successText | `#4ED197` |
| warningSurface / warningText | `#2A2115` / `#F3C98B` |
| infoSurface / infoText | `#14202E` / `#A9CBF2` |

Every text/background pair above clears WCAG AA (4.5:1 body, 3:1 large). The
earlier proposal shipped `#0E8A7D` (4.26:1 with white) and a white coral glyph
(2.81:1); both were replaced rather than accepted, because the doc had said
"verify when applying" and nobody had.

## 6. Typography

System font stack only (`Fonts` in theme.ts) — fast, native, free, nothing to
bundle or load on open.

| Step | Size / weight | Use |
|------|---------------|-----|
| display | 28 / 700 | screen titles, auth brand |
| title | 22 / 700 | member name |
| heading | 18 / 600 | section and record names |
| body | 16 / 400 | body, inputs, medicine name |
| label | 14 / 500 | meta, detail columns, buttons |
| caption | 12 / 400 | eyebrow, timestamps, uppercase labels |

Rules:
- Body never below 16sp. OS font scaling is respected (no fixed heights on
  text containers that would clip at 200%).
- Uppercase eyebrows get `letterSpacing: 0.6–0.8`; display sizes get negative
  tracking (−0.2 to −0.8) so headings do not read as spaced-out body text.
- Detail columns use `fontVariant: ["tabular-nums"]` so dates and doses line
  up down the ledger.

## 7. Avatars — monograms, not emoji

A member's avatar is an initial in a tinted stamp (`Avatar` component), or
their photo when one exists.

- Why: the default Android font renders 👴/👵 as a white or yellow cartoon
  face, which read wrong for this audience and looked like a toy; an emoji also
  cannot take `textSecondary`, dark-mode ink, or a selected ring.
- Eight tints (`AVATAR_TINTS`): teal, clay, sand, sage, sky, lilac, rose,
  slate — each with a light and dark ink pair.
- `avatar_value` stores the tint id. Legacy emoji ids map onto the matching
  tint, so existing rows keep a sensible identity without a migration.
- Initials come from the name at render time (`Ammi` → `A`, `Zara Khan` → `ZK`).

## 8. Marks and iconography

Marks are drawn from views, not emoji or exotic glyphs:
- `Magnifier` — two shapes; the 🔍 emoji is a blue cartoon and `⌕` is missing
  from several Android system fonts (tofu box on a low-end phone).
- `CameraMark` — three shapes; same reasoning.
- The app icon, adaptive layers, monochrome layer, favicon and splash mark are
  generated by `scripts/generate-assets.mjs` — a house (`ghar`) with a
  rounded cross (`dawae`), teal ground, coral cross. The mark is geometric, so
  it is reproducible and carries no risk of fake lettering.

## 9. Layout and spacing

- Reuse the existing `Spacing` ramp (`2/4/8/16/24/32/64`); no new magic
  numbers. Screen gutter is 20; grid gutter is 12.
- Family grid: 3 columns at phone widths. Avatars are 68 at the grid, 64 in
  the member header, 48 in a picker, 40 in a search row.
- Content floor: every screen scrolls with `paddingBottom` of
  `BottomTabInset + 72` so the FAB never covers the last row.
- Minimum tap target 44; primary buttons 48–50.
- `MaxContentWidth` (800) stays for future tablet work; phones are the target.

## 10. Motion

Short, functional, ≤200ms. `Motion.press` 120, `Motion.insert` 180,
`Motion.fade` 160. No decorative loops, no 3D, no Lottie. Screen transitions
come free from the native stack.

## 11. Media plan

No generative imagery in the product. Every visual is either UI or a
deliberate graphic mark:

| Asset | Role | Route | Tier |
|-------|------|-------|------|
| App icon + adaptive layers | identity | vector, generated by node script | graphic direction (chosen as style) |
| Splash mark | first frame | same mark, coral-on-teal | graphic direction |
| Monogram stamp | member identity | code | UI |
| Prescription photo | the signature media moment | **the user's own capture**, shown full width | real media, no substitution |

The one image the app is remembered by is a real handwritten slip. It is never
faked, illustrated or replaced with a placeholder graphic — a stand-in would be
a defect, not a style.

## 12. Screen-level intent

- **Home** — family name as eyebrow, "Family" as the title, search, roster.
  The roster is the hero; the FAB in coral is the only accent on the screen.
- **Member** — identity row (stamp, name, relation/age/gender), count line,
  then dated ledger blocks. Empty state teaches the add flow.
- **Record** — the photo at full width first, then fields, then medicines as
  large medicine lines. Delete is the only red on the screen.
- **Add record** — camera-first; date defaults to today; recent doctors and
  medicine autocomplete from the family's own history.
- **Search** — the medicine hit IS a medicine line; member and record hits
  reuse the stamp and the `Rx` mark.
- **Settings / privacy** — tokenised surfaces, status in plain language.
  "Offline" is never styled as an error.

## 13. Non-negotiables

1. App open goes straight to the family grid when logged in. No visual gate
   blocks the offline path.
2. No 3D, no heavy animation libraries, no decorative motion.
3. Red means danger, always.
4. Body text ≥16sp, AA contrast everywhere. Contrast claims are verified
   before they are written down.
5. One medicine grammar across every surface.
6. Every colour comes from a token; a hardcoded hex in a screen is a defect.

## 14. Open questions

- Final avatar tint set may need one more tint for large families (>8 members;
  tints then repeat, which is acceptable — the letter disambiguates).
- Splash may later gain a single short mark animation; optional, not planned.
- Tablet layout (two-column ledger) deferred; `MaxContentWidth` is in place.
