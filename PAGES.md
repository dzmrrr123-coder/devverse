# PAGES — DEVVERSE v1

Source: `PLAN.md` §4 (surfaces) and §8 (build order). Seven pages, nothing beyond the plan.
A page earns a route only when it answers a different question than the others; a page that
answers the same question in more space is a section.

| # | Path | Its single job | Why it is not a section of another page | Phase |
| --- | --- | --- | --- | --- |
| 1 | `/` | Take one public GitHub URL and hand back a report link. | Without it there is nothing to analyse; it is the only page with an input. A form inside `/r/:id` would put the entry point on the artifact people receive, which must stay readable without an account. | 2 |
| 2 | `/r/:id` | Say which rung the project reached, one fix next, and why it matters. | This is the artifact that is *shared*: the URL is the unit of delivery and it must open cold, anonymous and permanent. A section of `/` would die the moment the visitor pastes a second URL. | 2 |
| 3 | `/how` | Explain what one check means, and what passing it looks like. | The report answers "how is my project"; this answers "what does this check even mean". Merging them would put a paragraph of teaching inside every one of 12 rows, which is the difference between a report and a manual. | 2 (linked from `/r/:id` from day one) |
| 4 | `/login` | Start a session, and nothing else. | The report must be openable without it (§4: "bisa dibuka tanpa akun"), so authentication cannot be a step inside the report. | Shipped |
| 5 | `/dashboard` | Workspace: saved projects portfolio + AI Assistant Studio with roadmap analysis. | It only exists for a signed-in user with saved projects and AI conversation history, protected by server-side auth. | Shipped |
| 6 | `not-found` | Say the link is gone or was never valid, in Indonesian, with a way back. | A 404 is a full page because the report is a link people forward: a dead link needs a sentence a human can act on, not a dialog over an empty report shell. | Shipped |
| 7 | `error` | Say the analysis failed (repo private, rate limited, GitHub down) and what to do next. | Same reason: it is reached by URL, from a shared link, possibly hours later. `PLAN.md` §6 separates "gagal" (a state of `/`) from a page that has to survive a cold load of a dead id. | Shipped |

## Phases

- **Phase 2 & 3 Shipped**: `/`, `/r/:id`, `/how`, `/login`, `/dashboard` (Portfolio Workspace + AI Assistant Studio with custom roadmap quick action), `not-found`, and `error`.
- **Phase 4** changes no route: "satu perbaikan berikutnya" deepens an existing region of `/r/:id`.

## What this pass decides

The signature screen is **`/r/:id`**. The other six inherit its identity later; no other page is
designed in this pass, and none of them may introduce a second visual language when it is built.
