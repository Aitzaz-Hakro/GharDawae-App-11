# Ghar Dawae — Phase 3: Feature Set & Prioritization

_Last updated: 2026-09-25_

## Decisions
- **OCR: OUT** — won't work reliably on local Pakistani slips / handwriting.
  Prescriptions are added as **photo (image) + manual entry** of key fields.
- **AI assistant: OUT of v1** — heavy + safety/liability risk. Revisit v2.

## Feature Dump (all considered)
| # | Feature | Verdict |
|---|---------|---------|
| 1 | Add family member (name, avatar, relation, age) | **MVP** |
| 2 | Add prescription/receipt via photo | **MVP** |
| 3 | Add prescription via manual entry | **MVP** |
| 4 | OCR auto-extract medicine names | **CUT** (unreliable on local slips) |
| 5 | Medicine list per member | **MVP** |
| 6 | Visit/doctor history per member | **MVP** |
| 7 | Offline view of all records | **MVP** (the core differentiator) |
| 8 | Search medicine/record | **MVP** |
| 9 | AI assistant (chat, precautions, food) | **v2** |
| 10 | Medicine reminders (dose alerts) | **v2** |
| 11 | Login / signup per member | **MVP** |
| 12 | Family list screen (avatar grid) | **MVP** |
| 13 | Doctor recommendation | **Later** (deferred in Phase 1) |

## MVP Scope (v1 — the line)
The app must let a manager:
1. Sign up / log in.
2. Create the family + add members (name, avatar, relation, age).
3. For any member: add a prescription/receipt as **photo + manual details**
   (doctor name, date, medicines, notes).
4. See a member's **medicine list** and **visit/doctor history**.
5. **View everything offline.**
6. **Search** across records.

That's it. Nothing else ships in v1.

## Deferred
- **v2:** AI assistant, medicine reminders.
- **Later:** doctor recommendation / find-nearby.

## Manual-Entry = Design Priority
Because OCR is cut, **manual entry must be extremely fast and low-friction**
(this is where Rex/oladoc likely annoy users). Fast add = a real competitive
edge. Design for it hard in Phase 4.

## Open Question Carried Forward
- What exact fields per prescription? (doctor, date, diagnosis, medicines[],
  dosage, notes, photo) → finalize in Phase 6 data model.
