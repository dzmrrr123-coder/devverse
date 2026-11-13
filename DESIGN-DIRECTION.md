# Design direction — DEVVERSE `/r/:id`

Build plan: PLAN.md
Source: human — 12 Nov 2026, a direct instruction, not a preference. The direction below
exists because of it; nothing here was chosen for how cheap it is to build.
Status: PROPOSED — the canvas verdict is open (see `## Canvas review`).

The screen is the readiness report a student opens on their own repository. One screen,
two frames, the same content on both.

## Design surface

- Canvas: `devverse/devverse-design.figcraft` (FigCraft, headless, one process).
- Chosen frames, both drawn this round:
  - `MEJA KERJA · 1440 — chosen 12 Nov 2026` (frame id 179, 1440 × 950)
  - `MEJA KERJA · 390 — chosen 12 Nov 2026` (frame id 180, 390 × 1064)
- Exports at scale 2: `shots/meja-kerja-1440.png`, `shots/meja-kerja-390.png`.
- Superseded frames stay in the file, renamed rather than deleted so the record is not
  rewritten: `refused — 1 Papan Ukur · light ledger`, `refined — 2 Meja Kerja · dark bench
  (superseded 12 Nov)`, `refused — 3 Jalur · cream editorial`.
- Reference evidence: `shots/refs/` — nine screenshots of the sites the lock cites.
- Measurement evidence: `.design-proof/contrast.ps1` (feeds the table in commitment 4),
  `.design-proof/witness-1-ledger.html`, `witness-2-rail.html`, `witness-3-page.html`
  (the structural witnesses `design-divergence.ps1` read for round 1).

## 1. Task shape

`list-at-volume` — one repository, ten checks across four levels, read as rows, and the
whole point is that a student can see in one pass which level they are on and which single
thing to do next. Not `browse-hierarchy` (there is nothing to narrow — the levels are
fixed and four), not `monitor-over-time` (the reading is dated, not live), not
`single-focus` (the checks are comparable rows, not one repeated control).

The task shape decides what the screen is allowed to hide: a list read at volume may
collapse its passed rows, and must never collapse the row it is asking about.

## 2. Skeleton

Two regions, not a stack of bands. A 312px instrument rail runs the full height on the
left — wordmark, repository, the four-level rail, the state key, the telemetry line. An
1128px reading column carries the statement, the collapsed passed rows, the frontier
panel and the next fix.

Order, top to bottom, in the reading column:

1. status bar — what this page is, the commit and timestamp, the share control (0–60)
2. statement — `Level 2 lulus.` at 54px, and the sentence that follows it (96–212)
3. passed rows — two levels collapsed to one line each, with the check ids as evidence (228–354)
4. frontier panel — level 3 open, three checks, their evidence, their state words (368–668)
5. next-fix band — one label, one 30px title, two lines of body, one control (712–858)
6. footer — the permalink and what it is (884–950)

The rail runs the same six blocks as a vertical index, so a reader can navigate by level
without scrolling the column. That is the asymmetric split: the rail is not a sidebar of
decoration, it is the ladder the column is about.

Phone (`390`): one column. The rail becomes a 60px four-cell strip pinned to the bottom of
the viewport, drawn in the frame. Nothing in the reading column is indented for it.

## 3. Numeric scales

Type: 54 / 34 (statement, desktop / phone), 30 / 24 (fix title), 19 (subline), 18 (repo on
phone), 16 / 15 (check name), 15 / 14 (body), 13 (passed-row name), 12 (control label),
11 (rail state words), 10 (telemetry, panel headers), 9 (micro labels, 8 on the phone
strip). Line heights: 58, 38, 30, 23, 21, 19, 15, 13. Letter spacing: −1.5% on the
statement, −1% on the fix title, +12% on every micro label, +8% on the panel headers.

Spacing ramp, and where each step is spent: 2, 4, 8, 12, 16, 20, 24, 32, 44, 48, 64. Rows
are 75px on desktop (a 16px name over a 12px evidence line, 8px apart, inside 24px of
panel padding) and 84px on the phone. Section breaks are 44–48px; the page margin is 64px
on desktop and 20px on the phone; the rail's internal padding is 32px.

Radius: 0 on the panel, the strip and the rule; 2px on the two controls (`Bagikan`,
`Buka panduan`) and nothing else. Hairlines are 1px, the trace is 2px, the current-level
marker is 8 × 14px, a state square is 8 × 8px (7 × 7 on the phone).

Widths: page 1440, rail 312, reading column 1128, content 1000, panel 1000 / 350, phone
frame 390, phone content 350, control height 30 (desktop) / 40 (phone), strip 60.

## 4. Palette roles

Nine values, one accent, and every text pair measured. The accent is spent exactly twice:
the trace and the next-fix label — the same claim in two places.

- `#0B1013` ink — the page. Near-black with a green-graphite cast, warmed so it reads as a
  dark room rather than a switched-off screen.
- `#121A1E` panel — the rail and the phone strip, one step up so the rail is a surface and
  not a border.
- `#172227` raised — the frontier panel only. No shadow anywhere on this page.
- `#182126` selected — the current level's band in the rail and the current cell on the
  phone strip. A background step, not an outline.
- `#EFF3F1` text — the statement, names, the fix title. 17.09:1 on ink.
- `#A6B3B0` secondary — evidence paths, the subline, the body, `tidak_tahu`. 7.49:1 on raised.
- `#83918E` quiet — labels, telemetry, the level ahead, `belum sampai`. 5.37:1 on panel.
- `#263236` hairline, `#1C2629` soft — separators. Decorative, exempt from the text floor,
  and never the only thing carrying a state.
- `#F2B267` signal — the trace, `SEKARANG DI SINI`, the next-fix label. 8.76:1 on raised.
- States: `#63D9C6` pass, `#F0916B` fail, `#A6B3B0` unknown. Shape carries the state first
  (filled square / filled square / open square) and colour second. There is no red, no
  badge, and no chip anywhere on the page.

Measured, per pair, against the surface it actually sits on. Run
`.design-proof/contrast.ps1` to reproduce. No text on this page is set with an opacity,
because an opacity moves the measured ratio.

| text | on | px | ratio | needed | verdict | carries |
| --- | --- | --- | --- | --- | --- | --- |
| `#EFF3F1` | `#0B1013` | 54 | **17.09:1** | 3:1 | PASS | statement "Level 2" (desktop 54px / phone 34px) |
| `#EFF3F1` | `#0B1013` | 34 | **17.09:1** | 3:1 | PASS | repo name desktop |
| `#EFF3F1` | `#0B1013` | 30 | **17.09:1** | 3:1 | PASS | next-fix title |
| `#EFF3F1` | `#172227` | 17 | **14.49:1** | 4.5:1 | PASS | frontier check name |
| `#EFF3F1` | `#121A1E` | 15 | **15.74:1** | 4.5:1 | PASS | level name in the rail |
| `#EFF3F1` | `#0B1013` | 12 | **17.09:1** | 4.5:1 | PASS | button label "Bagikan" / "Buka panduan" |
| `#EFF3F1` | `#121A1E` | 11 | **15.74:1** | 4.5:1 | PASS | wordmark DEVVERSE |
| `#63D9C6` | `#0B1013` | 54 | **11.18:1** | 3:1 | PASS | statement "lulus." (the pass word) |
| `#63D9C6` | `#172227` | 11 | **9.48:1** | 4.5:1 | PASS | state word "lulus" on a check row |
| `#63D9C6` | `#121A1E` | 10 | **10.29:1** | 4.5:1 | PASS | state word "lulus" in the rail |
| `#F0916B` | `#172227` | 11 | **6.93:1** | 4.5:1 | PASS | state word "gagal" on a check row |
| `#F2B267` | `#172227` | 10 | **8.76:1** | 4.5:1 | PASS | panel header "SEKARANG DI SINI" |
| `#F2B267` | `#0B1013` | 10 | **10.33:1** | 4.5:1 | PASS | label "SATU PERBAIKAN BERIKUTNYA" |
| `#A6B3B0` | `#0B1013` | 19 | **8.83:1** | 4.5:1 | PASS | subline "Berikutnya Level 3" |
| `#A6B3B0` | `#0B1013` | 15 | **8.83:1** | 4.5:1 | PASS | repo description, next-fix body |
| `#A6B3B0` | `#172227` | 13 | **7.49:1** | 4.5:1 | PASS | evidence path under a check |
| `#A6B3B0` | `#172227` | 10 | **7.49:1** | 4.5:1 | PASS | state word "tidak_tahu" on a check row |
| `#A6B3B0` | `#121A1E` | 13 | **8.13:1** | 4.5:1 | PASS | collapsed level checks in the rail |
| `#83918E` | `#0B1013` | 12 | **5.84:1** | 4.5:1 | PASS | footer URL, telemetry line |
| `#83918E` | `#121A1E` | 10 | **5.37:1** | 4.5:1 | PASS | rail labels, "belum sampai", engine line |
| `#83918E` | `#0B1013` | 12 | **5.84:1** | 4.5:1 | PASS | phone bottom-strip label |

Twenty-one pairs, twenty-one passes, nothing under 5.37:1 anywhere, so the smallest text
on the page is not the marginal one. The previous direction's `quiet` value (`#8A938F` on
`#F1F4F2`) measured **2.85:1** — a WCAG failure at every size, shipped, and no check in
the workbench caught it. That value is gone with that direction, and the table above is
the replacement for the guess: the numbers are produced by a script, not by eye.

## 5. Signature anchor

**The trace.** The one failing check is the only thing on this page that has to move. Its
8px state square opens a 2px amber line that leaves the panel's left edge, runs 20px out
into the page margin, drops 221px straight down past the two passing rows and the level-4
station, turns once, and lands on the left edge of the next-fix title. One lit path from
the fault to the procedure, and it is the only curve-free, non-rectangular object on the
page.

It survives the filter that kills most anchors: it would not fit ten other apps, because
it exists only where a page has both a located fault and a prescribed fix on the same
surface. It needs no card grid — it is drawn in the whitespace a grid would have eaten.
And it is load-bearing rather than decorative: if the failing check changes, the wire
changes; if all checks pass, the wire is absent and the band becomes a single line. It is
also the reason the phone frame drops it (see commitment 10) — 20px of margin cannot hold
a wire, so the phone says the same thing in words.

## 6. Three defaults refused

1. **Refused: a dark theme applied to a list.** The first pass at this register was exactly
   that, and it failed — a dark background under the same light-mode anatomy. This version
   moves the ladder into a rail, gives the rail an index function, and makes the trace the
   only moving part. A dark surface with no instrument in it is a mood, not a direction.
2. **Refused: red for the failing state.** A readiness report for a 16-year-old does not
   get an alarm colour. `gagal` is `#F0916B` — warm clay, 6.93:1 — and it is always paired
   with a filled square, so the page never says "failure" in the one register that is read
   as a reprimand.
3. **Refused: a score.** No percentage, no ring, no `2/4`, no per-level counter, no streak.
   The honest unit here is the level (`Level 2 lulus`), and a fraction next to it turns a
   pass into a shortfall. The four-cell strip on the phone is a track, not a scoreboard:
   it shows position, never a ratio.
4. **Refused: a card.** The frontier panel is one inset well with hairline rules between
   rows; there is no card grid anywhere, no shadow, no 12px radius, and nothing is a
   floating tile. A report that is four cards is a dashboard, and a dashboard is the shape
   that makes a student compare themselves to a stranger.

## 7. Density per region

Deliberately uneven, because one density for the whole page flattens the hierarchy the
screen exists to state:

- Rail: **dense** — 76px per level, 10px labels, 32px padding. It is an index and should
  be scannable at a glance.
- Status bar and statement: **airy** — 60px bar, then 96px of air above a 54px statement
  and 44px below it. This is the one sentence the page is about.
- Passed rows: **dense** — 40px each, two levels inside 126px, check ids in mono at 11px.
  Passed work should be cheap to skip.
- Frontier panel: **dense** — 75px per check, 16px name over 12px evidence, 8px apart.
  This is the half that deserves the close reading.
- Next-fix band: **airy** — 44px above the label, a 30px title, two lines of 15px body.
  The instruction gets room, because it is the only thing the reader has to do.
- Footer: **dense** — two mono lines and a stamp.

## 8. Motion

What moves: the share control's confirmation. Pressing `Bagikan` copies the permalink and
the label swaps to `Tersalin` in place for 1200ms, at 120ms opacity, then swaps back —
no toast, no layout shift. Control hover and press are a fill change at 120ms on the same
easing. That is the whole motion budget.

What never moves: the trace, the rail markers, the level band, the state squares, the
statement, the rows, and the phone strip. Nothing animates on load, nothing pulses, nothing
shimmers, no number counts up. A pulse on the trace was designed and refused: it would make
the one honest signal on the page into a notification.

`prefers-reduced-motion: reduce` removes both transitions and both durations become 0ms —
the label swaps instantly and the hover is a colour change with no interpolation. The page
renders and reads correctly with JavaScript disabled: the copy control is the only scripted
behaviour, and without it the permalink is still visible as text and selectable.

## 9. Components

The ladder, cheapest proven thing first. `native` means a platform element and its own
states; `existing` means nothing yet (this is the first surface); `library` means a
dependency added; `new` means code written for this surface, which has to say why the other
three cannot do the job.

- Report masthead — source: native (`header`, `h1`, `p`, `time`), why: a repository name and
  a timestamp are text; a long `owner/name` wraps at 500px and the slash never breaks.
- Level rail — source: new, why: no platform element draws four named stations on one spine
  whose single segment carries state, and the old bench version wasted 380px of a 390px phone; this one is 312px on desktop, an index in the rail, and a 60px strip with the current cell lit on the phone. The same component draws the trace at ≥1200, because the trace is the rail's stroke leaving the rail.
- Passed row — source: native (`li` inside `ol`, hairline via `border-block-start`), why: a
  collapsed level is one line of text and three check ids, and its states are hover and
  focus-within, neither of which changes its height.
- State square — source: native (`span` with a `::before` 8px box), why: filled, filled and
  open are three CSS states, not three icons, and each word keeps its text label so colour
  is never the only signal.
- Frontier panel — source: native (`section` with a `role="list"`), why: one inset surface,
  three rows, hairline dividers; the panel is a background and a border, not a widget.
- Next-fix band — source: native (`aside` with `aria-labelledby`), why: present and absent
  are the two states, and the absent state is one line of text rather than a hole.
- Share control — source: new, why: the copy affordance sits on the identifier it copies,
  confirms in place without a toast, and keeps a 40px target at 390px; no library button
  does that without being restyled into something that no longer matches a 2px radius.

The absent state matters as much as the present one: when every check at the frontier
passes, the band does not disappear — it becomes one 19px line reading `Semua check di
Level 3 lulus. Berikutnya Level 4.` with the same amber label, and the trace is not drawn
at all. Ladder sources: `REFERENCE-HUNT.md` → `## Component references`.

## 10. Breakpoints

Three bands, and the phone frame is drawn rather than described, because that is the band
the instruction was aimed at.

- 320–767 phone: one column at 20px margins. The rail stops being a column and becomes a
  60px four-cell strip pinned to the bottom of the viewport — `01 Nyala` … `04 Siap
  dibagikan`, the current cell lit with a 2px amber top edge and a raised background, 97.5px
  per cell, all four always visible. The level rows appear in the flow as a compact
  `SUDAH LULUS` block instead. Statement drops 54 → 34, fix title 30 → 24, check name 16 → 15,
  evidence 12 → 10, panel 1000 → 350.
- 768–1199 tablet: the rail stays a column at 260px, the reading column loses its 64px
  margins to 40px, the passed-row evidence truncates to two check ids, and the next-fix
  control moves under the body instead of beside the title.
- 1200+ desktop: the drawn screen — 312px rail, 1128px column, 64px margins, 1000px
  content, the trace drawn in the 20px margin between the rail and the content.

What the narrowest band drops, deliberately: the trace (no margin to hold a 2px wire — the
failure is carried by the state word and the fix title instead), the state key/legend
(the three words are read in place on three rows), the rail's 01–04 numerals as a column
(they survive as strip cells), the full timestamp (`a3f9c21 · 12 Nov · 14:07 WIB` instead
of the desktop line), and the engine line. Nothing that carries state is dropped, and no
row goes below 4.5:1 at any width.

## Reference locks

Two registers, both from the product-ui side of the pool. Full lock with URLs, keep/avoid
traits and the refused identity: `REFERENCE-HUNT.md`. The short form:

- **Register 1 — Precision Instrument** (Linear, Raycast): a dark surface where the
  measurement itself is the interface, mono for the reading, one accent at a time.
- **Register 8 — Quiet Utility** (Postman, roadmap.sh): a report that is dense without
  being loud, and where a reader can find their own row without instructions.

Locked, and held: `Keep` — a single accent spent on position, not decoration; monospace for
identifiers and nothing else; a page whose hierarchy survives being screenshotted. `Avoid` —
dashboard card grids, gradient glows, purple-on-black, icon chips per row, a ring or score.
`Identity refused` — no logo, palette, photo or copy from any reference is reused; the
ladder, the trace and the four-cell strip are this product's own.

## The blend — where each percentage lives

The mandate is 40 / 30 / 20 / 10, written by the human, and it is a spec rather than a
mood. One line per percentage, naming the element that carries it on the drawn screen.

- **40% Space Mission Control** — the graphite instrument surface with an amber signal, the
  312px rail whose 1px spine carries 9px station ticks, the telemetry line
  (`a3f9c21 · 12 Nov 2026 14:07 WIB`, `engine v0.4.2`), and the frontier panel read as a
  readout. On screen: the whole left column plus the panel frame, at 1440 and at 390.
- **30% Developer Workshop** — every identifier is drawn in mono and shown as evidence, not
  as a label: `readme_ada · kode_utama · tanpa_rahasia`, `tests/AbsensiTest.php`,
  `tidak ada .github/workflows`, `8 baris · GitHub Actions`, `devverse.app/r/7Kq2mNpR4tXa`.
  The vocabulary is the repository's own, so the student recognises their own files. On
  screen: both frames.
- **20% Cozy Productivity** — the warmth inside the darkness: graphite rather than blue-black,
  amber that reads as a lamp, a 54px statement written as a sentence (`Level 2 lulus.
  Berikutnya Level 3 — Bisa dipercaya`), and 44–48px of air wherever the page asks the
  reader to slow down. On screen: the statement block and the next-fix band on both frames.
- **10% Game Progression** — the four-station track: `01`–`04` ordinals with a filled, lit or
  open marker on desktop, and the four-cell strip with the current cell lit on the phone.
  It shows position on a known ladder and nothing else.

Honest limit on the 10%: the game layer appears **only** as that track. There is no XP, no
badge, no streak, no unlock animation and no trophy on this screen, so the drawn pixels
carry closer to 8% than a full 10%. The rest of the game vocabulary a product like this
wants — a completed-level stamp, a `Level 3 → 4` promotion moment, anything celebratory —
belongs on `/dashboard` (phase 3 in `PAGES.md`), which is a returning student's screen, not
on a single shared report that a first-time visitor opens once. Claiming 10% here would be
a claim the pixels do not show.

## Direction chosen

Options: `1 — Papan Ukur` (light ledger, `ledger-rows`), `2 — Meja Kerja` (dark instrument,
`asymmetric-split`), `3 — Jalur` (cream editorial, `document-flow`).
Selected: `2 — Meja Kerja`, refined into the two frames above.
Chosen by: human — 12 Nov 2026.

Rejected, and why, in the human's own order of reasoning:

- **1 — Papan Ukur, rejected.** It was recommended for being the cheapest to build on a
  phone, and that criterion is now forbidden: *"gaada pilih arah design yg murah"* — there
  is no such thing as picking a cheap design direction. It also never carried the blend:
  a light paper sheet at 20% cozy with no instrument in it is not 40% mission control.
  Its surface does not return.
- **3 — Jalur, discarded.** The editorial register — serif display, margin annotation,
  warm cream — does not exist anywhere inside the 40/30/20/10 blend. It was a good screen
  for the wrong brief.
- **2 — Meja Kerja, kept and repaired.** The 380px rail that made it unusable at 390px was
  a design problem, not a reason to abandon the register. It is now a 312px rail on desktop
  and a 60px pinned strip on the phone.

The agent's earlier recommendation of option 1 is superseded: it was a build-cost argument,
and build cost is not a design criterion here.

Axes: surface (light → dark), geometry (0px everywhere → 0 on surfaces, 2px on controls),
color (rust on paper → amber on graphite), type (Work Sans + IBM Plex Mono → Bricolage
Grotesque + Geist Mono), density (uniform compact → dense in the rail, airy in the
statement and the fix), motion (none → one 120ms swap).

## Canvas review

The current round is written first because the gate, and any reader, reads the first
`Verdict:` field in this section as the live state. With the refused round above it, the gate
would keep reporting REVISE even after the human answers, so the refusal is kept below as
history rather than deleted.

### Current - round 2, approved by the human

Export: shots/meja-kerja-1440.png
Phone export: shots/meja-kerja-390.png
Shown: 2026-11-12, chat reply - both frames at scale 2, with the measured contrast summary
(21 pairs recomputed independently, lowest 5.37:1) and a pointer to the table in section 4.
Verdict: APPROVED
Approved by: human - 2026-11-12
Scope: the drawn frames as exported, including the frontier panel that shows level 3's three
checks (one `lulus`, one `gagal`, one `tidak_tahu`). The approval covers that framing - the
level is the honest unit, and no score, fraction, ring or counter appears anywhere on the
page. The phone frame's drop of the trace and the state key is approved as drawn.

### History — round 1, refused by the human

Export: shots/direction-1.png
Shown: 2026-11-12, chat reply — the three exported PNGs at 1440px (`direction-1.png`,
`direction-2.png`, `direction-3.png`), with direction 1 named as the pick.
Verdict: REVISE
Reason: the pick was made for build cost, not for the blend — *"gaada pilih arah design yg
murah"*. Direction 1 was rejected as a light paper surface, direction 3 as off-brief
(editorial sits outside the 40/30/20/10), and direction 2 was named the starting point with
its phone failure treated as the design problem to solve.
Approved by: not given — a refusal is not an approval

## Convergence ledger

Read before choosing, appended after. Five entries now: a dark hi-vis dashboard
(`modular-wall`), a light spec-sheet landing page (`stacked-masthead`), a light ledger sheet
(`single-object`), this project's rejected light ledger (`ledger-rows`), and this one.

This direction moves the two axes that mattered. `surface` goes dark, which ends a run of
three light entries. `composition` is `asymmetric-split`, new to the ledger, and the
`accentHue` leaves the warm-red family for `amber`. The combination
`dark · sans+mono · amber · asymmetric-split` is not in the file, and the ledger reports
**21 passed, 0 failed** with no deliberate flag: the earlier `deliberate: true` on the light
surface was resolved by the human's instruction rather than argued with, and the entry that
carried it stays in the ledger as the record of what was superseded, not as a live claim.

## What the measurements do not cover

- Contrast is computed from the palette, not sampled from the exported PNG. If a fill, a
  blend or a hairline ever changes on the canvas without the direction document changing,
  the table is stale and says nothing.
- The table covers text. It does not certify the 1px hairlines (exempt by WCAG, and
  deliberately dim) or the amber trace (a graphic, not text — its 2px weight is a legibility
  choice, not a measured one).
- Nothing here was rendered in a browser. The frames are canvas exports, so font metrics at
  real device widths, focus rings, and the strip's overlap behaviour during scroll are
  `UNVERIFIED` until the build is rendered.
- The phone frame is the whole page at 390px with the strip drawn at its end. In a live
  viewport the strip is fixed and the column scrolls under it; that behaviour is a build
  question this frame does not prove.

## Design register

Register: EXPENSIVE

Cost center: composition

Why this is not cheap: The budget is spent on one asymmetric split plus the empty margin beside it, and the trace is drawn through that margin with measured coordinates - a template fills the margin with cards instead, which is why the same page could not be produced by a starter.

Cheap tells refused:
- A grid of equal cards: replaced by a 380px rail, one frontier panel, and a single report column that keeps its whitespace instead of tiling it.
- A red-amber-green badge with a percentage: replaced by an 8px state square and the plain word `lulus`, `gagal`, or `tidak_tahu`, with no score anywhere on the page.
- A dark SaaS gradient with glow accents: replaced by flat `#0B1013` ink, one-step surfaces, and the amber signal spent exactly twice - on the trace and the next-fix label.
- Hero illustration and emoji icons: replaced by the wire itself, mono telemetry, and the state key as the only legend.

Template test: It cannot fit ten other readiness tools, because the trace only exists where one page has both a located fault and a prescribed fix on the same surface; remove either and the layout collapses back into a list.