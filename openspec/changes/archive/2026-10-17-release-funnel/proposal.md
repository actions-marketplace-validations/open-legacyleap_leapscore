## Why

The release brief's funnel rests on three surfaces staying in lockstep: every report ends with the positioning line, carries a result-specific next step with a tracked link, and names its band with one public vocabulary. Today they don't. The CLI emitters end at the methodology link (no positioning line, `render.ts:69,107-109`); CLI stdout prints the tracked URL but not the next-step sentence the brief requires "printed once" (`seal.ts:125-134`); the report's methodology link (`leapscore.dev/methodology`) has no route behind it — the site serves `/method` — so the checklist item *"Result-specific next step in both the report and the CLI"* is half-satisfied and its methodology link is a dead end in-repo; the site still shows `Healthy` / `High Risk` bands (`lib/scoring.ts:35-40`) while the CLI, JSON, and specs ship `Low` / `High`; and the site's own report surfaces (sample, persisted, live) end with no next step at all.

`/assessment` (the tracked-link landing page), the booking destination, and click-through measurement are explicitly **deferred** to a follow-up change — but every other funnel surface must be correct before that page lands, or the landing resolves into incoherence.

## What Changes

- **Positioning line, single-sourced** — `packages/contracts` gains `POSITIONING_LINE` ("LeapScore sees the structure. The assessment understands what the code does."); CLI HTML/Markdown emitters and site report surfaces render it verbatim at the end.
- **CLI stdout next step** — stdout prints the band-specific next-step sentence (same text as the reports) with the tracked assessment URL exactly once; the existing status line (`score/tier gates coverage threshold`) stays machine-parsable and first.
- **Site report next step** — sample, persisted, and live report surfaces gain a bottom band: band CTA + tracked link (`utm_campaign` + `band` preserved) + positioning line, imported from the same contracts helpers the CLI uses.
- **Methodology link resolves in-repo** — new `/methodology` route that `permanentRedirect`s to `/method` (same `permanentRedirect` pattern as `app/report/sample/page.tsx`); `METHODOLOGY_URL` stays unchanged; the `/method` route and nav keep their names.
- **One public band vocabulary** — site UI migrates to `Low / Moderate / High / Critical` (legacy map keys retained for stored envelopes); canonical rubric band tables (`docs/rubric/11` §3, `docs/rubric/README.md`, `00_EXECUTIVE_RUBRIC.md`, score-sheet templates) rename labels with thresholds untouched; `tier_legacy` (Low→Healthy, High→High Risk) stays for one release; the 0–3 row taxonomy (`3 — Healthy`) is **not** renamed. **Not BREAKING**: no `CONTRACT_VERSION` bump, no JSON value change.
- **Funnel-landing chrome honesty** — `/method` "Where we are now" and the footer disclaimer stop describing the live engine as unshipped; the broken relative rubric links (`../rubric/README.md` on home + footer) point at `/rubric`. The homepage/product "coming + waitlist" narrative is **not** touched (staged marketing refresh, out of scope).

Deferred to the follow-up `assessment-funnel` change: the `/assessment` page, booking destination, and click-through measurement. Deferred with release-packaging: the README positioning line (consumes the shared constant). Not fixed here: `leapscore.dev` is NXDOMAIN, so tracked + methodology links do not resolve publicly until the domain and site deploy exist — a release blocker recorded as a risk.

## Capabilities

### New Capabilities

- `release-funnel`: the cross-surface funnel contract — positioning-line single source and placement, next-step surfaces (CLI stdout, site reports) with the tracked-link grammar, public band vocabulary (Low/Moderate/High/Critical + one-release legacy aliases), and methodology-link resolution.

### Modified Capabilities

- `report-rendering`: the "CLI HTML and Markdown emitters" requirement gains the positioning line and a resolvable methodology link; "Band-specific next step" tightens the stdout contract (next-step sentence + URL exactly once, status line unchanged).
- `scan-local`: the "Out directory with three reports" stdout requirement is corrected — the spec currently claims "top risks" on stdout (never implemented); it becomes status line + next-step line with the tracked URL once.

## Impact

- **Code**: `packages/contracts/src/index.ts` (+ its test), `apps/scanner/src/scan/render.ts`, `apps/scanner/src/scan/scoring/seal.ts` (`formatStdout`), `apps/scanner/bin/scan.ts`, `apps/scanner/src/scan/__tests__/cli-offline-scan.test.ts`; `apps/site/lib/scoring.ts`, `apps/site/lib/provider.ts` (sample tier label), `apps/site/app/reports/page.tsx`, `apps/site/components/gates-table.tsx`, `apps/site/components/report-view.tsx` + new next-step band component, new `apps/site/app/methodology/page.tsx`, `apps/site/components/footer.tsx`, `apps/site/app/page.tsx`, `apps/site/app/method/page.tsx`.
- **Docs (canonical rubric)**: `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §3, `docs/rubric/README.md`, `docs/rubric/00_EXECUTIVE_RUBRIC.md`, `docs/rubric/templates/*` (derived views follow canonical); decision line appended to `docs/plans/00_MASTER_INDEX.md` (supersedes W5's legacy band naming; thresholds unchanged). `npm run check:rubric-consistency` must stay green.
- **Specs**: `openspec/specs/release-funnel` (new), `report-rendering`, `scan-local` — deltas in this change.
- **Risks**: deferred `/assessment` + measurement means report→assessment click-through stays unmeasurable until the follow-up lands; `leapscore.dev` NXDOMAIN blocks public resolution of both the tracked and methodology links; stored envelope tier strings vary (`Moderate` fixture + future `Low`/`High`) so site maps keep legacy alias keys; canonical rubric rename must not disturb the compiled `tiers` keys or the 0–3 row taxonomy.
- **Non-goals**: `/assessment` page + booking + measurement (follow-up `assessment-funnel`); README/LICENSE/Action/npm packaging (`release-packaging`); offline-by-default flip (`offline-default`); home/product launch-story refresh; benchmark/opt-in comparison; any detector/scoring math.
