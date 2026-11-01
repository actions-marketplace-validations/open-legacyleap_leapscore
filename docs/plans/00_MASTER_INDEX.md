# Product and rubric decision history

> **Status:** Historical index and decision record. The entries below preserve proposals and outcomes from their planning period; an `AGREED` status records that decision then, not a guarantee that the proposal shipped or remains current.
>
> **Current authority:** post-MVP scan/report requirements are in [`openspec/specs/`](../../openspec/specs/); rubric semantics and scoring values are canonical in [`docs/rubric/`](../rubric/); detector implementation contracts are canonical in [`docs/specs/`](../specs/). Use the [documentation landing page](../README.md) for the full ownership map. This file is not a current behavior contract.

---

## Documents

| # | File | Purpose |
|---|------|---------|
| 00 | [`00_MASTER_INDEX.md`](00_MASTER_INDEX.md) | This index + decisions log |
| 01 | [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) | Historical product definition, intended users, and proposed product doors |
| 02 | [`02_TRUST_SCORING_MODEL.md`](02_TRUST_SCORING_MODEL.md) | Historical scoring/trust model and status vocabulary |
| 03 | [`03_ENGINEERABILITY_MATRIX.md`](03_ENGINEERABILITY_MATRIX.md) | Derived historical matrix; canonical automation fields now live on rubric entries |
| 04 | [`04_V1_SCOPE.md`](04_V1_SCOPE.md) | Historical first-release scope and sequencing |
| 05 | [`05_DETECTION_ENGINE_BLUEPRINT.md`](05_DETECTION_ENGINE_BLUEPRINT.md) | Historical engine architecture proposal |
| 06 | [`06_DATA_MODEL_API.md`](06_DATA_MODEL_API.md) | Historical report and API schema proposal |
| 07 | [`07_COMPETITIVE_LANDSCAPE.md`](07_COMPETITIVE_LANDSCAPE.md) | Market research as recorded when written; recheck before external use |
| 08 | [`08_SECURITY_ACCESS_MODEL.md`](08_SECURITY_ACCESS_MODEL.md) | Historical security and access proposal |
| 09 | [`09_MONETIZATION_TIERS.md`](09_MONETIZATION_TIERS.md) | Historical monetization proposal |
| 10 | [`10_ROADMAP.md`](10_ROADMAP.md) | Historical phased delivery plan and open decisions |
| 11 | [`11_WEBSITE_SPEC.md`](11_WEBSITE_SPEC.md) | Historical website routes, copy, and demo-data proposal |
| 12 | [`12_GITHUB_SURFACE_PLAN.md`](12_GITHUB_SURFACE_PLAN.md) | Historical GitHub reporting-surface proposal |
| 13 | [`13_MVP_SLICE.md`](13_MVP_SLICE.md) | Historical 19-indicator MVP proposal; a subset of the 31 detectors currently implemented |
| 14 | [`14_WORKFLOW_SCAN_V1.md`](14_WORKFLOW_SCAN_V1.md) | Workflow-scan design record; current behavior is specified in OpenSpec |
| 15 | [`15_PROJECT_SURFACE_V1.md`](15_PROJECT_SURFACE_V1.md) | Issue-surfacing design record; current behavior is specified in OpenSpec |
| 16 | [`16_PROJECT_SURFACE_V2.md`](16_PROJECT_SURFACE_V2.md) | Board-linkage decision record; proposals here are not current commitments |

**Historical reading order:** the original plan dependencies run 03 → 04 → 05 → 06–09; 10 summarizes those proposals. This is a guide to the historical reasoning, not a required order for understanding the current implementation.

---

## Current implementation (verify behavior in OpenSpec)

| Layer | Location | Truth |
|-------|----------|-------|
| Scanner engine and CLI | `apps/scanner/src/scan/`, `apps/scanner/bin/scan.ts` | Remote scans use the unified GitHub API + shallow-clone path; local scans read the target directory. Thirty-one detectors are implemented; remaining indicators are disclosed as not implemented. The shared `sealScan` composer emits the terminal report. |
| Scanner service | `apps/scanner/src/server.ts` | `GET /scan` streams versioned NDJSON; `GET /health` reports service health. The service is stateless: the terminal report frame is the scan artifact, with no permanent report store or scanner permalink. |
| Shared contracts | `packages/contracts/` | Producer-owned report envelope, run ID grammar, band vocabulary, badge, and related shared contracts. |
| Website | `apps/site/` | `/live` streams from the scanner. `/reports` and run pages render site-owned static history; the site does not execute scans or read reports from the scanner at request time. |
| Issue surfacing | `apps/surface/` | Separate process and token boundary; it turns a sealed envelope into issue updates. |
| Canonical documentation | `docs/rubric/`, `docs/specs/` | Rubric files own scoring semantics; per-indicator specs own implementation contracts. `docs/plans/03` is derived. |
| Repository checks | `npm run check:rubric-consistency`, `npm run check:detector-isolation`, `npm run check:site-boundary`, `npm run check:bin-wiring`, `npm run check:dist` | Enforce rubric generation, app boundaries, command wiring, and the shipped CLI artifact. Generated rubric files are not hand-edited. |

These implementation facts are a navigation aid and may age; use the linked current specs and code for a specific behavior. `13_MVP_SLICE.md` records an earlier 19-row proposal, not the present detector count.

---

## Decisions Log

Format: `#` · Decision · Source rule / rationale · Status

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| D1 | One engine, two front doors: public freemium SaaS (any public repo URL) + internal private-repo M&A screening via GitHub App | Freemium gives distribution + a data moat; M&A is the revenue path | **AGREED** (grill Q1) |
| D2 | Every indicator row carries a status: `measured` / `estimated` / `unknown` | ~36 of 102 indicators are provably unmeasurable from a URL; scoring them blindly destroys trust | **AGREED** (grill Q2) |
| D3 | Headline score is computed over `measured` + `estimated` only; `unknown` rows are surfaced, not hidden | Honesty is the product's credibility; unknown rows double as the M&A deep-dive shopping list | **AGREED THEN** (grill Q2; denominator policy later superseded by [deterministic scoring](../../openspec/specs/deterministic-scoring/spec.md) and [measurement honesty](../../openspec/specs/measurement-honesty/spec.md)) |
| D4 | `estimated` rows are capped/banded (≤ 1 point ceiling, explicit confidence tag) so guesses cannot dominate the headline | Prevents a heap of weak inferences from moving the single number | **AGREED** (grill Q2) |
| D5 | v1 is static-analysis + GitHub API only. No test-suite execution in a sandbox | Test-execution buys ~4 indicators at the price of a security review + container sandbox + scan-time explosion; belongs in a later paid "deep scan" | **AGREED** (grill Q3) |
| D6 | Every repo scores on day 1 regardless of ecosystem; language-gated indicators report `unknown` honestly | Manifest sniffing + language-agnostic scans (git, CI, docs, dependabot) run for all repos | **AGREED** (grill Q3) |
| D7 | Detection engine orchestrates existing OSS tools (gitleaks, trivy, osv-scanner, jscpd, knip, dependency-cruiser, Scorecard, …); v1 does not write analyzers from scratch | Build cost is orchestration + rubric mapping, not analysis | **AGREED** (grill Q3) |
| D8 | First ecosystem gate: JS/TS (npm) + Python. Then Go + Java (Maven/Gradle). Ruby/PHP/C#/Rust later | Coverage vs. cost per language | **AGREED** (grill Q3); "C#/Rust later" clause superseded for legacy stacks by D10 (brief Req 10) |
| D10 | Brief Req 10 supersedes D8's "C#/legacy later" clause for the legacy-stacks scope: .NET/VB.NET (incl. VB6) + Delphi coverage ships now, with legacy-Java fidelity; Ruby/PHP/Rust stay later | Req 10 names the customer stacks ("Prioritise the stacks our customers run: Java, .NET including VB.NET, VB6, Delphi") and gates release on a two-estate validation (one .NET, one Java); D8's coverage-vs-cost ordering predates that customer set, so the gate is release-blocking, not deferrable | **AGREED** (legacy-stacks · brief Req 10) |

---

## Decisions Log — CODEDEBT rubric redesign (grill A1–E1)

Format: `#` · Decision · Rationale · Status

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| A1 | Every rubric row serves both human auditors and the LeapScore engine | One catalog, two consumers; the human writes the audit, the engine automates the measurable subset | **AGREED** |
| B1 | Each entry carries 4-level scoring criteria (0–3) per global core-path taxonomy | The `core` (files reachable from public entry points touching money/auth/PII/compliance) is the scoring lens everywhere | **AGREED** |
| B2 | Global computed core-path taxonomy replaces per-category gets | Consistent, engine-computable, explainable core definition | **AGREED** |
| B3 | `N/A` state + applicable-row denominator; Category% = (Σ row scores ÷ applicable×3) × 100 | Rows that don't apply aren't penalized or padded (kills the old fixed "8 rows ÷ 24" framing) | **AGREED** |
| B4 | Deep-dive rows fold into the category score when a deep audit runs | Deeper data makes the total more trustworthy, not a separate number | **AGREED** |
| B5 | Uniform means within a category; importance expressed via gates, not weights | Keeps weights few and calibratable; gates carry the absolute must-not-be-red rules | **AGREED** |
| B6 | Weights/thresholds parameterized in `11_WEIGHTS_THRESHOLDS_CONFIG.md` + calibration schedule | Single editable config; pre-v1 spot-check, post-audit fit after 20 audits, quarterly review | **AGREED** |
| C1 | FE gets 10% weight when a client exists; other nine categories scale ×0.9 | Clients matter but must not crowd out backend risk; weights stay normalized | **AGREED** |
| C2 | +5 indicators: ARCH-09 (agentic operability), ARCH-10 (config debt), VEL-09 (PR hygiene), VEL-10 (branching), FE-07 (i18n) | Five real 2026-era decay classes the catalog missed | **AGREED** |
| C3 | Variable row counts per category (contiguous renumber: standards 01…N, deep-dives N+1…) | Catalog grows honestly; no fake parity | **AGREED** |
| C4 | +G7 (DATA-06 red) and +G8 (ECOS-05 red) gates | Data-rescue and copyleft risks are portfolio-gating | **AGREED** |
| D1 | Engineerability matrix absorbed into the encyclopedia (`Engine tier` / `Default status` / `Scope/overlaps` per entry); matrix is a derived view | One canonical place for automation taxonomy + measurability | **AGREED** |
| D2 | Scope/overlap boundaries documented per entry | Disambiguates which row owns a signal; engine maps detection → one row | **AGREED** |
| D3 | Encyclopedia is canonical; consistency check validates rows against templates | Prevents drift between catalog, templates, and engine | **AGREED** |
| E1 | Pre-v1 A-tier threshold spot-check + calibration log | Validates green/yellow/red cutoffs on 5–10 real repos before shipping | **AGREED** |
| F1 | `docs/specs/` is canonical for implementation: per-indicator inputs, detection recipes, fact schemas, statusing predicates, gate hooks, failure/budget semantics (one file per indicator under `docs/specs/<NN_CATEGORY>/`) | Encyclopedia stays canonical for semantics/thresholds (specs reference, never restate); specs arbitrate encyclopedia-vs-matrix drift via each entry's own Definition+Detection text, logging every correction in `docs/specs/README.md` §4 for one reconciliation commit at completion | **AGREED** (grill Q1–Q6) |
| D9 | MVP = 19 Tier-A `measured` indicators across 5 categories (SEC 4 + ECOS 5 + ARCH 3 + VEL 4 + TEST 3); dual headline (MVP-normalized + honest-partial + coverage bar); two-phase scan (Phase 1 GH API <10s + Phase 2 clone 4-min). Gates G1/G2/G3/G8 proven else `needs-verification` | Minimal eng, max screenshot variance, zero `unknown` apologies on measured set; preserves full 102-indicator product; spec is `docs/plans/13_MVP_SLICE.md` | **AGREED** (mvp grill → 13) |

---

## Decisions Log — website (grill W1–W12)

Format: `#` · Decision · Rationale · Status · Source (grill Q)

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| W1 | Website is a marketing/demo site first, architected so the freemium product front door can grow into it: landing page + hand-crafted sample report; live scanning swapped in later | The "beautiful report" trailer is the marketing artifact; B→A means the seam (URL param → report shell) is product-shaped from day 1 | **AGREED** (Q1) |
| W2 | Primary persona: engineering lead scoring their own repo; single conversion action = paste URL → watch report → share the evidence | The report is the marketing; CTO/portfolio angle is a secondary section; M&A stays off this site | **AGREED** (Q2) |
| W3 | Sample report scores a real, famous repo in the Moderate band with full honesty UI (coverage bar, gates, expandable rows) + prominent "illustrative sample" label | Recognition punch + believable debt; honesty branding demands the numbers stay derivable and labelled | **AGREED** (Q3, Q7) |
| W4 | Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; demo data behind a `ReportProvider` interface mirroring `06_DATA_MODEL_API.md` | Product-shaped SSR/SEO + auth path; the seam makes B→A a provider swap, not a rewrite | **AGREED** (Q4) |
| W5 | Aesthetic: dark "instrument panel"; tier colors (≥80/53–79/27–52/<27) are the only color language; Inter for UI, mono for evidence | Native to the IDE-dwelling persona; equal-form-is-equal-meaning without decoration | **AGREED** (Q5) |
| W6 | Three routes: `/` (hero + URL box + proof strip + tier tease), `/report/sample` (full report), `/method` (scoring model). Report gets its own route = the future `/r/[owner]/[repo]` | The report is the product and must not be scroll-squeezed; `/method` does the honesty trust-work | **AGREED** (Q6) |
| W7 | Hero URL box is a *working* component: submit → `/report/sample?repo=X`, header echoes X, persistent sample-disclaimer banner above the report | The box is the wiring test for A (same param feeds a live scan later); a dismissible disclaimer on fabricated data is the one move the brand forbids | **AGREED** (Q8) |
| W8 | Keep **LeapScore** name (not LegacyScore); logo = dial/gauge mark (one arc, one needle, tier-colored), domain `leapscore.dev` | Name stability > momentary descriptiveness; the mark reads as an instrument, matching W5 | **AGREED** (Q9) |
| W9 | Website lives in this repo under `apps/site/`; session deliverable = this spec (`11_WEBSITE_SPEC.md`) + decision log; code is a later session | Rubric is `docs/rubric/` canonical source the mock data references; no code until catalog agreed applies to the engine, not to marketing artifacts | **AGREED** (Q10) |
| W10 | Report anatomy: header dial → coverage strip → gate table (cockpit board) → category table w/ 1 expanded row + "inspect all 102" toggle → bottom URL-box CTA | Density kills beauty; default view gorgeous, full depth one click away; renders the real `06` schema with seeded values | **AGREED** (Q11) |
| W11 | Tone = "audit-grade, not advertising-grade": terse declaratives, second person, one honest number per claim; never claim a capability the live site lacks | Same voice as the docs; hides-nothing is the differentiator and must extend to the site's own claims | **AGREED** (Q12) |
| W12 | Demo data governable by rubric: `django/django` ≈58/100 (Moderate, top of band), coverage 65/25/10 measured/estimated/unknown, one heavy near-miss gate, no fired gate | Numbers must survive an engineer recomputing from the rubric; the demo is a render of the real schema, not free-form decoration | **AGREED** (Q7) |
| W13 | Homepage grows to six blocks (hero fold, report teaser, proof strip, who-it's-for band, credibility band, waitlist CTA) and a new `/product` route carries the full product story; header/footer nav extended with Product + Rubric links; M&A stays off-site | "All of it" product content, hybrid placement: compact bands on the funnel, depth routed — W5 density preserved; the credibility band makes the public rubric checkable from the front door | **AGREED** (grill) |
| W14 | Product copy uses an artifact-present register: present tense only for renderable artifacts (report, rubric, method); the live engine and Deep Scan stay future-gated ("coming" + waitlist) | W11 applied forward: no claim the live site lacks; the honesty model is the pitch, so present tense is reserved for what is demonstrably rendered | **AGREED** (grill) |
| W15 | Deployment topology is produce/present: `apps/scanner` owns scan execution, the trust/sandbox boundary, GH-token custody, and the canonical report store (versioned NDJSON scan API + stable per-runId permalinks); `apps/site` is present-only (statically prerendered `/reports`, in-place `/live` reveal from the terminal frame, no engine import/token/request-time reads); `packages/contracts` is the versioned envelope + runId-grammar boundary | Counterpart to W4 (data seam) and W9 (website location), agreed when the site was demo-only: the in-process live scan has been cut over to the scanner, `/live` renders in place with the scanner permalink, and a build-time check (`check:site-boundary`) keeps the present side from re-acquiring an engine runtime | **AGREED THEN** (deployment boundary retained; store/permalink decision superseded by the [stateless scan API](../../openspec/specs/scan-api/spec.md)) |
| W16 | Public band vocabulary is `Low` (≥ 80) / `Moderate` (53–79) / `High` (27–52) / `Critical` (< 27) on every surface — CLI stdout, JSON `headline.tier`, CLI HTML/Markdown reports, site UI, and the canonical rubric band tables; the legacy names (`Healthy`, `High Risk`) survive one release as machine-only `tier_legacy` aliases and are never displayed as band labels | The CLI/JSON already sealed `Low`/`High` while the rubric docs and site UI said `Healthy`/`High Risk` — one public vocabulary removes the contradiction; supersedes W5's band naming in `11_WEBSITE_SPEC.md`; thresholds unchanged (80/53/27), compiled `tiers` keys unchanged, and the 0–3 row taxonomy (`3 — Healthy`) is a row verdict, not a band, so it is not renamed | **AGREED** (openspec `release-funnel`) |

---

## Open website decisions (deferred to the code session)

- W-OPEN-1: Waitlist mechanics (email capture → where it lands; newsletter tool).
- W-OPEN-2: Exact seeded indicator rows for the Django sample (top blockers + remediation text pulled from rubric encyclopedias).
- ~~W-OPEN-3~~ **DONE:** `apps/site/` bootstrapped (App Router + TS + Tailwind + shadcn/ui); lint/format/vitest established; live scan, persisted reports, and rubric browser shipped (see "Implementation status").

---

## Decisions Log — workflow scan v1 (grill R1–R8)

Spec: `docs/plans/14_WORKFLOW_SCAN_V1.md`. Execution-only; no in-repo surfacing (stays in `12`).

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| R1 | One workflow, optional `target_repo` defaulting to `github.repository` (self zero-config; target = parameterization) | Single code path for self/target; no second workflow to maintain | **AGREED** (grill v2-Q1) |
| R2 | Public targets need no PAT (`GITHUB_TOKEN` passthrough); private targets require PAT/App token with `contents:read`, else loud fail | Clone is anon-capable; GH API auth only lifts quota (`gh.ts:118`); `GITHUB_TOKEN` from runner A cannot read private T (engine refuses `private_requires_app`) | **AGREED** (grill v2-Q2) |
| R3 | No `actions/checkout` of T — engine clones internally from URL; local-path `runLocalScan` dropped | Engine entry is `runUnifiedScan(repoUrl)` + internal shallow clone; avoids a second engine input contract for v1 | **AGREED** (grill v2-Q3 revert) |
| R4 | Thin CLI `apps/scanner/bin/scan.ts` (`--repo … --out leapscore-report.json`, reusing `runUnifiedScan` + `scoreMvp`) + 3-step workflow (setup-node → npx scan → upload-artifact) | No CLI/action/package existed then; CLI-first keeps the scanner service (`GET /scan`) and Actions sharing one scorer; no Docker/reusable-workflow latency | **AGREED** (grill v2-Q4) |
| R5 | `workflow_dispatch`-only; two optional inputs (`target_repo` default self, `sha` default empty); no schedule, no push/PR | Engine scans HEAD at trigger time; per-commit scanning is the rejected `12` §9 territory and the 10s–240s budget doesn't belong on the critical path | **AGREED** (grill v2-Q5) |
| R6 | Empty `sha` = default-branch HEAD; non-empty `--sha` fails loudly (`exit 2`), pinning deferred (`clone.ts` fetch-pinned + `gh.ts` `ref` plumbing) | No hardcoded `main` (`master` repos exist); `shallowClone` is HEAD-only today so pinning has nothing to bind to — honest reject per the `12` §7 rule | **AGREED** (grill v2-Q6) |
| R7 | Report seals (any score, gates fired or not) → exit 0; no report → non-zero (`1` crash, `2` refused/unsupported-input) | v1 is an audit instrument, not a quality gate; no team consent to break builds; `12` §4 fail-on-gate belongs to the surfacing world | **AGREED** (grill v2-Q7) |
| R8 | Artifact `leapscore-report.json` (`{ report, meta, trace }` envelope mirroring website, schema `"1"`); per-run name, `retention-days: 30`, `if: always()`; perms `contents: read` | Parallel dispatches must not collide; machine file + human stdout; minimal blast radius | **AGREED** (grill v2-Q8) |

---

## Decisions Log — project surface v1 (grill S1–S15)

Spec: `docs/plans/15_PROJECT_SURFACE_V1.md`. Workflow tickets-in-project; tickets-only (no check runs / website links — `12` trio deferred).

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| S1 | Self-surface first — extend the `14` workflow, no App / LeapScore infra in v1 | Reuses `GH_TOKEN`, no cross-repo consent story; proves ticket lifecycle before the `12` App model | **AGREED** (grill Q1) |
| S2 | Lazy find-or-create per-target boards; multiple target projects may live in one runner repo | Zero-config like `14`; no project URL/number inputs to validate | **SUPERSEDED** (explore: issues-only v1 — no board; per-target separation via labels/titles/token. Board returns with v2 auth) |
| S3 | Board name `LeapScore-<owner-dash-repo>` sanitized, no sha; sha lives in bodies/comments | Per-sha boards break dedup (`repo × indicator` continuity) and litter the runner; run identity belongs in the timeline (`12` §5 rule) | **SUPERSEDED** (explore: issues-only v1 — no boards at all; slug sanitization now serves the target label/title/token instead) |
| S4 | Tickets/projects always live in the runner repo A; T is scan-subject-only | `GITHUB_TOKEN` from A cannot write into foreign T; avoids cross-repo writes `14` deferred | **AGREED** (grill Q4) |
| S5 | All applicable non-Green `measured`+`estimated` rows mint/update; `unknown`/`N/A` never mint | Burst disclosed + deduped steady-state O(newly-degraded); unknowns stay in the artifact as the deep-dive list | **AGREED** (grill Q5) |
| S6 | Indicator-only token `<!-- leapscore:v1 indicator=… -->` kept; disambiguation via project membership with a project→items→issue-bodies discovery walk; Search API forbidden | Multi-target in one repo collides under label listing; walk is heavier (GraphQL + REST pagination) but scoped; index lag would duplicate burst tickets | **SUPERSEDED** (explore: issues-only v1 — extended token `<!-- leapscore:v1 target=owner/repo indicator=… -->` + REST list-by-label discovery; label is prefilter, token authoritative; Search API still forbidden) |
| S7 | `12` §5 lifecycle verbatim: open / band-change comment+reopen-close / wobble comment / Green auto-close / immediate reopen / deleted=recreated | Continuity in the timeline; no debounce (calibration candidate) | **AGREED** (grill Q7) |
| S8 | `12` §5 body verbatim: status + evidence snippet + remediation + sha/links; ticket is a derived view; `<!-- leapscore:human -->` zone survives | Ticket actionable alone but never the source of truth | **AGREED** (grill Q8) |
| S9 | `12` label taxonomy intact + `leapscore:target-<slug>`; no per-run/sha labels ever | Cross-target `label:leapscore:red` mixes boards without the target label; per-target ≠ per-run so the ban holds | **AGREED** (grill Q9) |
| S10 | Inputs-only config: `surface:true/false` default `true`; no `.github/leapscore.yml` parsing in v1 | No file parsing, no Pro keys to disclose yet; file config arrives with the App story | **AGREED** (grill Q10) |
| S11 | Tickets-only slice: no check run, no website links (explore: no board either — issues-only v1); artifact stays the machine record | Keeps perms to issues+projects; proves lifecycle first | **AGREED** (grill Q11; scope narrowed by explore — perms now issues-only) |
| S12 | Warn-only surfacing: `14` exit map untouched (0 sealed / 1 crash / 2 refused); ticket failures → summary+stdout, artifact still uploads | Ticket failure never rewrites a sealed scan verdict | **AGREED** (grill Q12) |
| S13 | Private guardrail: private T surfaces only into private runner or self-scan; public-runner×private-target = execution-only + loud `surface-skipped` | Never copies private evidence cross-boundary into a public runner (`12` H11 honesty applied across repos) | **AGREED** (grill Q13) |
| S14 | Sequential/low-concurrency writes with backoff + burst counts in summary; duplicate tokens first-match-wins + warning | Respects abuse limits; first-scan burst undisguisable so disclose it | **AGREED** (grill Q14) |
| S15 | Persist on disable/drop: no auto-close/delete; manual cleanup only | No uninstall webhook on workflows; history stays | **AGREED** (grill Q15) |

---

## Decisions Log — project surface v2 (gate V1 open)

Spec: `docs/plans/16_PROJECT_SURFACE_V2.md`. Board linkage; v1 (`15`) ships issues-only first either way.

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| V1 | PAT-board-first vs direct-to-App-board | B-first = days not weeks, no App packaging; direct-C = no PAT lifecycle or migration burst. Proposed gate: first three production runners org-owned → direct-C, else B-first | **OPEN** (explore; owner + date TBD) |
| V2 | B ownership rule: service-account (never named engineer), org-scoped preferred; rotation = non-event, holder-change = re-boarding with runbook written first | User-node board ownership makes holder-change a re-burst + orphan cleanup; fine-grained PATs are single-owner and may face org-approval gates | **PROPOSED** (explore) |
| V3 | Auth matrix: issues on `GITHUB_TOKEN`, board ops on PAT/App token; `15` private-target guardrail carries over | Least privilege per op; board ops never cross visibility the issues can't cross | **PROPOSED** (explore) |
| V4 | Split authorship: bot-authored issues, notification-quiet board linker | PAT-authored issues auto-subscribe a human to every future ping on a ~20-ticket burst; board adds create no issue content | **PROPOSED** (explore; spike: confirm add-to-board notification behavior) |
| V5 | Explicit `board: auto\|on\|off` tri-state (`auto` default); `on`-without-token degrades loudly, never rewrites the scan verdict | Secret-presence must never be the only signal — "broken B" and "intended A" must look different | **PROPOSED** (explore) |
| V6 | Identity grammar unchanged (`target=` already reserved); roster = label listing, board = view; record board node IDs | v1 grammar was made migration-proof on purpose; V2 titles are not unique so names can't be keys | **PROPOSED** (explore) |
| V7 | B→C migration price accepted-if-B-ships: re-burst + freeze window + retire-after-verification | `copyProjectV2` duplicates config, not ownership; dual-board ambiguity needs a freeze rule | **PROPOSED** (explore; priced, not yet accepted) |

---

## Current post-MVP specifications

The current requirements live in `openspec/specs/`. Archived OpenSpec changes record how those requirements were developed; neither archive names nor the historical plan tables above replace the current specifications.

| Area | Current specifications |
|---|---|
| Scanning and workflows | [`scan-api`](../../openspec/specs/scan-api/spec.md) · [`scanner-service`](../../openspec/specs/scanner-service/spec.md) · [`scan-local`](../../openspec/specs/scan-local/spec.md) · [`scan-phase-1`](../../openspec/specs/scan-phase-1/spec.md) · [`scan-phase-2`](../../openspec/specs/scan-phase-2/spec.md) · [`scan-trace`](../../openspec/specs/scan-trace/spec.md) · [`workflow-scan`](../../openspec/specs/workflow-scan/spec.md) |
| Scoring and applicability | [`deterministic-scoring`](../../openspec/specs/deterministic-scoring/spec.md) · [`measurement-honesty`](../../openspec/specs/measurement-honesty/spec.md) · [`indicator-applicability`](../../openspec/specs/indicator-applicability/spec.md) · [`band-path`](../../openspec/specs/band-path/spec.md) · [`run-diff`](../../openspec/specs/run-diff/spec.md) |
| Reports and presentation | [`report-envelope`](../../openspec/specs/report-envelope/spec.md) · [`report-rendering`](../../openspec/specs/report-rendering/spec.md) · [`score-badge`](../../openspec/specs/score-badge/spec.md) · [`release-funnel`](../../openspec/specs/release-funnel/spec.md) · [`site-shell`](../../openspec/specs/site-shell/spec.md) |
| Coverage, data, packaging, and issue surfacing | [`stack-coverage`](../../openspec/specs/stack-coverage/spec.md) · [`offline-data-snapshots`](../../openspec/specs/offline-data-snapshots/spec.md) · [`cli-packaging`](../../openspec/specs/cli-packaging/spec.md) · [`issue-surfacing`](../../openspec/specs/issue-surfacing/spec.md) · [`open-source-release-materials`](../../openspec/specs/open-source-release-materials/spec.md) |

New post-MVP behavior is proposed and recorded through OpenSpec. Update this index only for product/rubric decision history; do not duplicate implementation requirements here.

---

## Original product principles (historical)

These principles record the initial product intent. They are retained as history, not as an override of current OpenSpec, rubric, or implementation-spec requirements.

1. **No silent guesses.** Every number in a report is traceable to evidence (`measured`), an explicitly-labeled inference (`estimated`), or nothing (`unknown`). No exception.
2. **Every repo gets a score.** Exotic or unsupported ecosystems still produce a partial-but-honest report with `unknown` rows explaining what's missing and how to get it measured.
3. **The rubric is the single source of truth.** Scoring language, weights, gates, and remediation text all come from `docs/rubric/`. The engine maps detection → rubric rows; it never invents new scoring semantics.
4. **The free tier must be safe to launch.** No sandboxed code execution on untrusted public repos in v1; no reputation-damaging guesswork.
5. **M&A's `unknown` list is a feature, not a shortfall.** It is the automatically-generated deep-dive scope.

---

## Questions recorded during planning (historical)

These questions preserve the state of discussion when the index was written. Their presence here does not mean they are still open; consult current sources before treating one as unresolved.

- OQ1: Headline number format — single 0–100, banded tier (Healthy/Moderate/High/Critical), or radar? (Tied to D3/D4; unresolved.)
- OQ2: Whether `estimated` affects the M&A verdict or is excluded entirely from gated B2B reports. (M&A buyers may want `measured`-only tallies.)
- OQ3: Report delivery form — web app, API, PDF, HTML packet? (Blocked on product spec review.) **Partial, as recorded in this plan:** web app, site-owned static fixture history, and the scanner NDJSON stream exist; the scanner remains stateless and has no permalink. PDF/packet remain open in this historical question.
- OQ4: Cost-per-scan budget target for the freemium tier (affects which indicators stay in the free path). (Fee link to 04/09.)
- OQ5: ~~Where `frontend annex` (FE-01…07) lands~~ **RESOLVED** in rubric redesign (C1): when a client exists, FE-01…07 + FE-08 deep-dive get a separate 10% and the other nine categories scale ×0.9; when no client exists, FE is skipped entirely.
- OQ6: Coverage-display rounding. W12 fixes the canonical counts 49 measured / 19 estimated / 8 unknown over 76 rows; exact-to-nearest display is 64/25/11, but W12 text says "65/25/10". Counts are canonical and asserted in `apps/site/lib/score.consistency.test.ts`; the site displays the computed rounded values (64/25/11). Decide whether to adopt the computed rounding or legislate a display convention so text and render can't diverge again.
