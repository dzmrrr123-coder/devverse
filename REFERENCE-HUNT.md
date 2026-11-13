# REFERENCE-HUNT — DEVVERSE `/r/:id`

`Status: OBSERVED` — 12 Nov 2026. Every URL below was opened in a browser at 1440×900
(`securityscorecards.dev` also at 390×844) and read at real content, not from a thumbnail.
Screenshots of what I actually saw are in `shots/refs/`.

## Reference lock

Surface class: product-ui
Registers: 1 (Precision Instrument), 8 (Quiet Utility)
References:
- https://roadmap.sh/frontend — a path of stations: one spine, three node states, essential vs optional branches (density `balanced`)
- https://securityscorecards.dev/viewer/?uri=github.com/ossf/scorecard — the closest job match: a readiness report of per-check verdicts with one-line reasons, read at 1440 and at 390 (density `compact`)
- https://github.com/vercel/next.js/actions — verdict rows: glyph left, name, one secondary line, metadata right, hairline separators, colour only on the glyph (density `balanced`)
- https://www.codewars.com/users/g964 — a rank ladder collapsed into a label; the case for what a ladder loses when it is only text (density `compact`)
- https://excalidraw.com — one working surface, a floating tool rail, hand-drawn annotation pointing at the controls, near-white (density `airy`)
- https://www.raycast.com/changelog — a metadata gutter beside a wide content block, one accent, no cards (density `airy`)
- https://www.freecodecamp.org/learn — levels listed in order with no progression state observed while signed out (density `compact`)
- https://github.com/ossf/scorecard/blob/main/README.md — a copy control sitting on the identifier it copies, plus eleven stacked status badges (density `balanced`)
Keep:
- the spine: one continuous vertical line with stations on it, so "how far along am I" is read without counting anything
- row grammar for a verdict: small glyph at the left, name at 16px, one secondary line, the evidence at the right, hairline separators and no box per row
- compress state by weight, not by colour: GitHub's list spends its only saturated colour on the verdict glyph and keeps every other row neutral
- the metadata gutter: Raycast puts version and date in a narrow left column so the content block can own the headline
- one annotation pointing at exactly one thing — Excalidraw's curved rule to a control is the only hierarchy device on an otherwise empty canvas
Avoid:
- a single global score at the top (the 8.3 ring). It becomes the whole story and every check underneath is read as a defence of it
- a red risk badge on every row. Twelve `HIGH` chips are an indictment before a single word is read, and at 390px they take the space next to the name
- numeric per-check values (10, 1, 4, 5). "Skor 1" is a grade; the audience is 15–18 and the product's promise is not a grade
- the equal block list (freeCodeCamp /learn signed out): seven identical bordered blocks with no state is a menu, not a path
- shield badges stacked under a heading — status spam is the fastest way to make a report look auto-generated
Identity refused: I will not copy roadmap.sh's saturated yellow node fill, its blue connector language or its node-and-arrow map; not the scorecard viewer's 8.3 ring, purple masthead or red risk taxonomy; not Raycast's black field and 64px display type; not Excalidraw's violet brand or its hand-drawn font as body copy; not GitHub's blue link colour or octicon set. The ladder's shape, the verdict vocabulary and the palette are DEVVERSE's own.

## Problem match

These are not "sites that look good". Each one does one of the four things `/r/:id` has to do:

| The job | Where it was answered |
| --- | --- |
| show how far along a path someone is, without a percentage | roadmap.sh, freeCodeCamp |
| list per-check verdicts with a reason and an expandable detail | securityscorecards.dev, github.com/*/actions |
| keep a verdict list scannable when the verdicts are mixed | github.com/*/actions |
| put one thing in front of the eye when everything else is secondary | excalidraw, raycast/changelog |
| make an artifact worth passing to someone else | scorecard viewer (shareable by URL), github copy-permalink |

## Squint notes

Squint from arm's length, name what comes first, second, third.

- **roadmap.sh/frontend** — 1st the yellow spine of essential nodes, 2nd the tan side branches, 3rd the floating AI Tutor pill. The single vertical line is what makes it read as "a way through", and the colour split does the "must / may" work silently. What disappears when squinting: the node labels, the ads, the article copy.
- **securityscorecards.dev** — 1st the purple masthead band, 2nd the green 8.3 ring, 3rd the column of red `CRITICAL`/`HIGH` chips down the right of the names. That third place is the failure: the loudest thing on a beginner's report is a stack of warnings.
- **github.com/vercel/next.js/actions** — 1st the two green check glyphs, 2nd the bold run names, 3rd the right-hand metadata. Nothing else carries colour, which is why 30 rows stay readable.
- **codewars** — 1st the teal ad banner, 2nd the small purple rank pill, 3rd the tab strip. The rank — the one thing the page is about — is fourth. A ladder reduced to a label stops being a ladder.
- **excalidraw** — 1st the wordmark, 2nd the centre menu list, 3rd the floating toolbar. The curved annotation is not in the top three and still steers the eye; that is what a single well-placed mark buys.
- **raycast/changelog** — 1st "Changelog" and "New Calculator" at ~64px, 2nd the white Download pill, 3rd the version pill in the gutter. The gutter works: date and version never compete with the headline.
- **freeCodeCamp /learn** — 1st the orange sign-in bar, 2nd the repeated grey blocks. Every block the same weight, no order cue, no "you are here".
- **github blob page** — 1st the badge wall under the title, 2nd the file tree, 3rd the code. Eleven green badges say nothing a sentence could not.

## Eye trace

- **securityscorecards.dev** (top pick for problem match): repo name → 8.3 ring → first row's green check → `CRITICAL` chip → down the right edge through red chips → expand chevron. The eye is pulled off the left column and down a red gutter it does not need.
- **roadmap.sh/frontend**: masthead title → yellow `Internet/HTML/CSS/JavaScript` block → down the spine → the green check badges on the left edge of each node → side branches. The spine wins; that is the property to steal.

## Density notes

- `securityscorecards.dev` — **compact**, and it works: ~72px rows, hairline separators, one name, one line of reason, score glyph in the gutter. Everything is findable without reading paragraphs. What fails is not density, it is the colour budget.
- `github actions` — **balanced**: 66px rows, two lines each, right-aligned metadata. The lesson is that a mixed verdict list stays calm when only the glyph is coloured.
- `roadmap.sh` — **balanced** but node-heavy; it works at 8 nodes and would break at 30 without collapsing.
- `excalidraw` — **airy**, justified because the surface is one canvas with one task; an airy *report* with 12 checks would be four screens of scroll on a phone.
- `freeCodeCamp /learn` — **compact** and failing: equal weight everywhere means the order is invisible.

## Direction seeds

Three readings of the blend, each answering "where does the ladder live?" differently.

1. **The ladder is the page** (`ledger-rows`, compact, light cool sheet). Levels are rows; the checks belong to the row that owns them; passed levels collapse to one line, the frontier opens, the levels ahead are a hairline and a word. Type: Work Sans + IBM Plex Mono. Geometry sharp.
2. **The frontier is the page** (`asymmetric-split`, balanced, dark bench). A standing rail on the left holds all four stations; the canvas on the right is only about the next level. Type: Bricolage Grotesque + Geist Mono. Geometry friendly.
3. **The path is a timeline** (`document-flow`, airy, warm paper). One reading column, the ladder drawn as a ruled margin line, and a single hand annotation pointing from the next fix to the row that blocks it. Type: Instrument Serif + Source Sans 3. Geometry tight-sharp.

They differ on composition, surface, density, type, geometry and colour — not on hue alone.

## Chosen direction

Recorded in `DESIGN-DIRECTION.md` under `## Direction chosen`, after the three were drawn and exported. The pick is the one that answers the product's one hard rule — a repository that only reached Level 1 must read as "on a path", never as a failing grade — in its structure rather than in its copy.

## Component references

Components marked `library` or `new` in `DESIGN-DIRECTION.md`, and what shipped products do with them.

- **Level rail** — https://roadmap.sh/frontend and https://www.freecodecamp.org/learn — roadmap.sh: station states are done (green check), in progress (violet dot) and not started (empty node), and the essential spine is filled while optional branches are a tint, so "must" and "may" are read without labels; at 1440 it is a wide graph, and at narrow width the same page collapses to a single column of nodes where the spine stays visible — the spine is what survives. freeCodeCamp: a level list is drawn as full-width bordered rows with an icon and a label, and **signed out, none of them carries a state at all** (observed); ordered but unordered-looking. Together: the spine must be explicit, and a level list with no per-level state is the defect to avoid.
- **Share control** — https://github.com/ossf/scorecard/blob/main/README.md and https://excalidraw.com — GitHub: an icon-only copy button sits directly on the identifier it copies (the file path), with the label in a tooltip and the result announced as a transient "Copied!"; two copy affordances exist on one page (path and raw), and both are icon-only 32px targets. I did not click, so the copied state is `UNVERIFIED`. Excalidraw: one `Bagikan` (share) button in the top-right of the working surface, opening a dialog; the button is the only filled control in the header, which is why it is found without a label. At 390 GitHub keeps the copy button beside the path and Excalidraw webs its header into a single row.
