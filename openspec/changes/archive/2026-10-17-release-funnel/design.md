## Context

See proposal.md — Why. Current state that shapes the approach:

- `apps/scanner/src/scan/scoring/seal.ts` (`formatStdout`) builds one stdout line (`score/tier gates coverage` + URL); `apps/scanner/bin/scan.ts` appends threshold state and the URL when missing. There is no next-step sentence anywhere on stdout.
- `apps/scanner/src/scan/render.ts` writes `report.html` / `report.md` ending at the methodology link (`METHODOLOGY_URL` = `https://leapscore.dev/methodology`); the site serves `/method`, not `/methodology`. No positioning line exists in code.
- The site reports (`apps/site/components/report-view.tsx`) end at the deep-dive/meta block — no next step, no positioning line. `apps/site/lib/scoring.ts` `TIERS` labels still read `Healthy` / `High Risk`; the CLI/JSON already seal `Low` / `High` with `tier_legacy` aliases.
- Band thresholds live canonically in `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §3; `00_EXECUTIVE_RUBRIC.md`, `docs/rubric/README.md`, and `docs/rubric/templates/*` are derived views that must follow. `tooling/scripts/compile-rubric.ts` compiles only thresholds (keys `healthy`/`moderate`/`highRisk`/`critical`) — band display labels are not compiled, so a label rename does not touch generated artifacts.
- `/assessment`, the booking destination, and click-through measurement are deferred to a follow-up change (user decision, 2026-10-17).

## Goals / Non-Goals

Design-level boundaries only (scope in proposal.md):

- Goals: one shared constant for the positioning line; one stdout composition rule that keeps the line machine-parsable; one shared site band component for all three report surfaces; in-repo resolution for both funnel links (`/methodology` redirect; `/rubric` link fix); label rename that leaves every threshold, compiled artifact, and the 0–3 row taxonomy untouched.
- Non-Goals: renaming the `/method` route or its nav label; renaming internal compiled `tiers` keys (`healthy`, `highRisk`); migrating stored `report.json` envelopes; touching the homepage/product launch narrative; building `/assessment` or wiring analytics (follow-up).

## Decisions

### D1 — Stdout stays one line; sentence + URL appended after status fields

Extend the existing single stdout line: `<score>/<tier> gates:… coverage:… [threshold:…] — <band sentence> <tracked URL>`, with the URL as the final token.

- Why: the brief says "the same line … printed once"; the existing test asserts `r.out` has length 1; scripts and the Action parse the leading fields. Reordering puts threshold state inside the status prefix so the URL stays final — today `bin/scan.ts` appends the URL defensively, which must move (the sentence cites the sealed band, so the composition needs the sealed tier — compose in `bin/scan.ts`/`formatStdout` with an explicit param, not string concat at two sites).
- Alternatives: two-line block (status line + CTA line) — rejected, breaks the printed-once contract and existing consumers without adding information; sentence-only on stdout, URL already there — rejected, sentence must be the same line the reports carry, including the link.

### D2 — Positioning line as a contracts constant

`POSITIONING_LINE` in `packages/contracts/src/index.ts`, imported by `render.ts` (HTML+MD) and the site band component. Tests assert the literal text and that only the constant holds it.

- Why: release-packaging's future README copies it verbatim; one source prevents emitter/report/site drift.
- Alternative: a constant per app — rejected (that is the drift we are removing).

### D3 — `/methodology` resolves via an in-repo redirect route

New `apps/site/app/methodology/page.tsx` calling `permanentRedirect('/method')`; `METHODOLOGY_URL` stays `https://leapscore.dev/methodology`.

- Why: works with any Next server deployment (no host config), is testable in-repo, follows the existing `permanentRedirect` pattern (`app/report/sample/page.tsx`), and leaves the nav label, route, and site-shell spec untouched.
- Alternatives: rename `/method` → `/methodology` with `/method` redirecting — rejected: churns nav copy, internal links, and the site-shell spec for cosmetic gain; `next.config.ts` `redirects()` — rejected: depends on host support and is invisible to unit tests.

### D4 — One site band component on every report surface

New `apps/site/components/report-next-step.tsx` rendered at the bottom of `report-view.tsx`, so the sample fixture, persisted runs, and the revealed live report all get it. It renders band sentence → tracked link → positioning line, reading `assessmentCtaForBand`, `assessmentUrlForBand`, `POSITIONING_LINE` from contracts.

- Why: three surfaces, one component, no per-surface copy; `report-view.tsx` is already a client component importing engine types, and contracts constants are client-safe.
- Alternative: per-page footers — rejected (triple copy, guaranteed drift).

### D5 — Band vocabulary: public labels renamed, everything below them untouched

Rename display labels to `Low / Moderate / High / Critical` (site `TIERS`, reports table, gates-table cap copy, method page) and rename the canonical band tables in `docs/rubric/` (`11` §3, then derived: `README.md`, `00_EXECUTIVE_RUBRIC.md`, `templates/*`), with a single "formerly Healthy / High Risk" mapping note where aliases are defined.

- Untouched: thresholds (80/53/27 and below-27), compiled `rubric.json`/`rubric.ts` `tiers` keys, `tier_legacy` mapping (kept one release; machine-only), stored envelopes (site maps keep legacy alias keys valid), the 0–3 row taxonomy (`3 — Healthy` is a row verdict, not a band).
- Why: one public vocabulary was an explicit release open question; the CLI already sealed `Low`/`High`, so the rubric docs and site must follow or every published surface contradicts the reports.
- Alternative: site-only rename, rubric docs deferred — rejected: the rubric is publishable release material; two vocabularies in one release is exactly the trust cost the brief warns about. Decision line appended to `docs/plans/00_MASTER_INDEX.md` supersedes W5's legacy naming mention (thresholds unchanged).

### D6 — Tracked URL exactly once per artifact

HTML/Markdown currently repeat the URL (CTA block + footer); collapse to once, final content after the CTA. The site band holds one link.

- Why: mirrors the existing stdout "exactly once" rule and avoids link spam in pasted reports; the scenario is directly testable.

### D7 — Chrome honesty edits are funnel-scoped

Only the two surfaces funnel visitors land on: the footer disclaimer and `/method`'s "Where we are now" copy — plus pointing the home/footer `../rubric/README.md` links at `/rubric` (repo-relative links 404 on the site).

- Why: a report's methodology link lands on `/method`; copy that says the engine is "in development behind the waitlist" contradicts a shipped CLI. The broader "coming" narrative is a marketing decision with its own change.

## Risks / Trade-offs

- [`leapscore.dev` is NXDOMAIN — both funnel links stay publicly dead] → Out of scope here; recorded as a release blocker in the proposal. In-repo correctness (`/methodology` route, `/rubric` links, URL grammar) is verified by tests so standing up the domain is sufficient later.
- [Deferred `/assessment` page means the CTA link has no landing yet] → Ordering dependency: the follow-up `assessment-funnel` change must land before the public release; until then the constant keeps pointing at the agreed path (`/assessment`).
- [Stored reports in `apps/site/lib/reports.ts` may carry legacy tier strings] → Keep legacy alias keys in every site map keyed by tier; no envelope migration; `tier_legacy` retained.
- [Longer stdout line (~200 chars) could break naive parsers] → Status prefix order is preserved and the URL is the final token; spec pins the shape; existing prefix-parsing tests stay green.
- [Rubric doc rename propagation drift] → Rename canonical `11` §3 first, propagate derived views in the same commit, gate on `npm run check:rubric-consistency` + a grep sweep task for stray `High Risk`/`Healthy` band strings.
- [HTML/MD snapshot tests may assert the old double-URL footer] → Update tests in the same task; the spec's once-per-artifact scenario is the new assertion.

## Migration Plan

No data migration: labels only, aliases retained both directions. Deploy order (all one commit series): contracts constant → scanner (stdout + emitters) → site (band, redirect, labels, chrome) → docs rename. Rollback: revert the commit series; persisted envelopes and old CLI output remain readable because legacy aliases stay. Public link resolution remains gated on domain + deploy + the deferred `/assessment` change.

## Open Questions

- Click-through measurement mechanism (site analytics vs booking-tool UTM) — follows the booking destination and `/assessment` landing; must not change this change's link grammar (`utm_campaign` + `band`) or spec.
- Booking destination for the $0 Assessment (external scheduler vs form) — follow-up change; the CTA copy already names the outcome, not the mechanism.
- Domain registration/pointing ownership — ops, tracked as a release blocker; no spec impact.
