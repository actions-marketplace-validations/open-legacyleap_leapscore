# AGENTS.md

**LeapScore** — monorepo. The scoring engine turns a codebase (local directory, or any public GitHub repo) into a legacy/maintainability score. **The implementation is live**: scanner service + CLI, persisted-report presentation, rubric browser, GitHub Action, issue surfacing.

Docs that say "planning only" are stale — see "Implementation status". Two doc layers carry build decisions: `docs/plans/` (pre-MVP rationale) and `openspec/` (everything built after the MVP). **For scan/report behavior, `openspec/specs/*` is current truth.**

## Layout (monorepo)

```
packages/contracts/    producer-owned single source: report envelope, runId grammar, band
                       vocabulary + thresholds, badge model, next-band-path grammar, funnel
                       copy, network allowlist. No deps. Every producer + consumer imports it.
apps/scanner/          PRODUCE side — the engine, colocated with its two entry points
  src/scan/              orchestrator (unified remote) · local (path scan) · budget · clone ·
                         gh · ingest · archetype · ecosystem · stackcensus · tree · store ·
                         queue · runner · scheduler · snapshots (vendored EOL + advisories)
  src/scan/detectors/    31 detectors (engine-native, the live path)
  src/scan/scoring/      scorer/ (mvp, phase1, rollup+gates, applicability, status) ·
                         bandpath · fingerprint · provenance · seal.ts (terminal composer) ·
                         rubric.json (compiled, generated)
  src/server.ts          GET /scan (versioned NDJSON) · GET /health — stateless
  bin/scan.ts            `leapscore-scan` CLI (local scan · --repo · gates · badge · baseline)
  dist/leapscore-scan.mjs  the shipped artifact: one readable ESM bundle, zero runtime deps
apps/surface/          sealed envelope → GitHub issues (separate process, separate token)
apps/site/             PRESENT side — Next.js static site: marketing, `/live` scan,
                       `/reports` + `/reports/[runId]`, `/rubric` browser, `/method`
action/                checkout-first GitHub Action over the committed dist
docs/rubric/           rubric (canonical) — 102 indicators + 11_WEIGHTS…CONFIG
docs/specs/            per-indicator impl specs (F1) — 102 files + normative README
docs/plans/            product/engine specs (00 indexes, 01→16 incl. website/surfaces/MVP)
docs/notes/            open-source release readiness + gap analysis (dated working notes)
openspec/              live change specs — specs/ is current truth, changes/archive/* is history
tooling/checks/        detector-isolation · site-boundary · surface-boundary · bin-wiring ·
                       dist-freshness · rubric-consistency (stub) · schemas (stub)
tooling/scripts/       compile-rubric (canonical → rubric.json + generated rubric.ts;
                       --check is the CI gate) · refresh-snapshots · snapshot-data
```

Root `package.json` workspaces: `apps/*`, `packages/*`, `action`. Run `npm run compile:rubric` / `npm run check:rubric-consistency` / `npm run check:detector-isolation` / `npm run check:site-boundary` / `npm run check:bin-wiring` / `npm run check:dist` from root.

## Routine development commands

- `npm install` — install workspaces and build the CLI bundle through the root `prepare` script.
- `npm run build` — build all workspaces; `npm run build:cli` — rebuild the scanner bundle.
- `npm test` — run workspace Vitest suites; `npm run lint` — run workspace lint/type checks.
- Run repository boundary checks from the root; every documented command must resolve after a clean install.

## Implementation status (read this before "planning only" notes elsewhere)

- **Scanner is a standalone service, colocated engine + entries** (`apps/scanner`). The former `packages/engine` is gone; the engine lives under `apps/scanner/src/scan/` and its scoring under `src/scan/scoring/`. The scanner is **stateless**: no permanent disk, no served reports, no permalinks — the terminal `report` frame is the sole scan artefact.
- **Scan paths live:** `runUnifiedScan` (`src/scan/orchestrator.ts`) for remote targets — GH-API lane + shallow clone (`--filter=blob:none`) under one indicator-count-driven deadline (`budgetForIndicators`, clamp 10s–240s, plus a 240s wall-clock killer that fails the run without sealing). `runLocalScan` (`src/scan/local.ts`) scans a directory with the 25 clone-capable detectors — no clone, no GH-API. `orchestrator.phase1.ts` (`runPhase1Scan`) is the GH-API-only path, kept for back-compat.
- **Coverage live:** 31 detectors (6 GH-API + 25 clone/local) of 102 indicators; the other 71 seal as `not_implemented` and render as honest stubs. The MVP slice (`docs/plans/13`, 19 rows) is a **subset** of what ships.
- **Terminal scoring is shared:** `src/scan/scoring/seal.ts` (`sealScan`) is the single composer for both the HTTP service and the CLI — score (frozen denominator by default), gates incl. the kill-switch cap, coverage, top blockers, derived next-band path, provenance manifest, `score_fingerprint`, `runId`.
- **Presentation:** the site never executes a scan. `/live` streams the scanner's NDJSON cross-origin; `/reports` + `/reports/[runId]` render **site-owned** history (v1 = one committed static fixture, no request-time filesystem reads). There is **no `/api/scan` and no site-side live provider** — `lib/provider.ts` is the sample seam only, and `lib/provider.live.ts` / `LiveReportProvider` no longer exist.
- **Surfacing is a separate app:** `apps/surface` turns a sealed envelope into labeled issues, warn-only, with its own token (`SURFACE_TOKEN`) so the scanner keeps `contents:read` only.
- **Decisions live in two places:** `docs/plans/00_MASTER_INDEX.md` (D1–D9, A1–F1, W1–W14) for product/rubric history, **plus** `openspec/changes/*` + `openspec/specs/*` for everything built after the MVP (unified budget, deterministic scoring, measurement honesty, offline snapshots, legacy stacks, band path, baseline diff, score badge, release packaging). Check openspec first for scan/report behavior; plans docs are the parent rationale.

## Three doc trees, different rules

- `docs/rubric/` — the rubric: 102 indicators across 10 categories + config. **This is the product.**
- `docs/plans/` — product/engine specs. Read order matters: `00` indexes everything and logs decisions; 01→10 have a hard dependency chain. Navigation start: `docs/plans/00_MASTER_INDEX.md` + `docs/rubric/README.md`.
- `docs/specs/` — per-indicator **implementation specifications** (decision F1): one file per indicator under `<NN_CATEGORY>/<ID>_<slug>.md`, plus a normative `README.md`. All 102 exist.

## The cardinal rule: canonical vs. derived views

The catalog is single-sourced (decisions D1/D3/F1):
- **Canonical — semantics/thresholds** (edit here): encyclopedia files `01_…`–`10_…` (per-indicator truth) and `11_WEIGHTS_THRESHOLDS_CONFIG.md` (weights, scoring formula, tier thresholds, gates).
- **Canonical — implementation** (edit here): `docs/specs/<NN_CATEGORY>/<ID>_*.md` — inputs, detection recipes, fact schemas, statusing predicates, score-mapping predicates, gate hooks, failure/budget semantics. Specs **reference** encyclopedia thresholds by ID; they never restate numbers.
- **Derived** (never hand-edit a number; match to canonical instead): `00_EXECUTIVE_RUBRIC.md`, `templates/*` score sheets, the category-weight tables in each encyclopedia `01`-`10` header, and `docs/plans/03_ENGINEERABILITY_MATRIX.md`.

Consequences: changing an indicator's thresholds/status → edit the encyclopedia row *and* the matching row in `00_EXECUTIVE_RUBRIC.md` Part 2 *and* the spec's §0/§4/§5 if detectability or predicates change. Changing weights/FE-active logic → edit only `11` §1 and propagate. The consistency check is `npm run check:rubric-consistency` (= `compile-rubric.ts --check`: asserts `apps/scanner/src/scan/scoring/rubric.json` + `apps/site/lib/generated/rubric.ts` match the encyclopedia — IDs, names, effort tags, remediation coverage). Run `npm run compile:rubric` to regenerate; never hand-edit the generated files.

## Conventions for editing the rubric

- **Indicator IDs:** `CATEGORY-NN` where category ∈ {ECOS, ARCH, TEST, SEC, DATA, API, VEL, PERF, DOCS, FE}. Standard rows are contiguous `01…N`, deep-dive rows continue `N+1…` (decision C3). No padding to a fixed count — variable row counts per category are deliberate.
- **Every encyclopedia entry** must carry the full field set seen in any existing entry: definition, why it matters, detection method, objective metric, Yellow/Red flags (`Yellow flag`/`Red flag` lines, with rationale), example symptom, blast radius, remediation, gold standard, **explicit 4-level `Scoring criteria (0–3, per global core-path taxonomy)`**, and `Verify effort:` tag.
- **Tags:** engine tier `A/B/C/D`, `Default status: measured/estimated/unknown`, `Scope/overlaps:` — every new/organized entry gets all three so the derived matrix stays derivable. `Scope/overlaps` is how sibling indicators avoid double-counting; define it explicitly against the closest neighbors.
- **Verify effort symbols:** ⚡ ≤30 min · 🔶 ~2–4 h · 🔷 ~1–2 days. The same tag drives the next-band path's cost classes (`⚡` sprint · `🔶` quarter · `🔷` structural).
- **Gates:** G1–G8 are the absolute kill-switches. A `proven` gate **caps the sealed band at High** (a score already in `Critical` stays there — the cap is a ceiling, never a floor) and the cap is disclosed on the sealed headline (`gate_capped`, `uncapped_tier`, `capped_by_gates`). A gate whose source rows are all unknown/`not_implemented` is `unevaluable` and is stated, never silently counted as clear. Read `00_EXECUTIVE_RUBRIC.md` Part 0 before touching anything score-model related.

## Conventions for editing docs/specs/

- **Skeleton is mandatory:** the 10 sections (§0 Identity … §9 Scope/overlaps echo) defined in `docs/specs/README.md` §1. Tier C/D rows ship a reduced form (Identity + Emission text + Scope echo) — their output is `unknown` + "what it takes to measure".
- **Normative preamble:** `docs/specs/README.md` §2 fixes statuses/clamp/confidence, the strict N/A rule (structural gate or exhaustive-surface absence only), budget classes, tool pinning, fact naming, evidence grammar. Specs cite it; they don't restate it.
- **Drift protocol (F1):** when an entry's Definition/Detection text contradicts its own header tags or `docs/plans/03`, specs arbitrate and log every correction in `docs/specs/README.md` §4. The pending reconciliation commit applies those corrections back to encyclopedia header lines and regenerates `03` — **65 corrections are logged and still unapplied**; until then, spec values win over both sources.

## Weights & scoring model (quick recap)

- Row states are 5-valued with precedence `not_implemented > not_applicable > unknown > estimated > measured`. `estimated` rows are clamped so an estimate can never claim Green/Red; `unknown` rows carry an `unknown_measure_path` ("what it takes to measure").
- Category % = (Σ applicable row scores ÷ applicable count × 3) × 100. **The sealed headline uses the frozen denominator:** `unknown` stays in the denominator as disclosed-unscored, while `not_applicable` and `not_implemented` are excluded from both sides. The renormalized variant (unknowns dropped from the denominator, weights renormalized) survives only as `renormalized_score`, reference-only, plus a one-release `--score-policy legacy` escape hatch. Deep-dive rows **fold into** the category when run — never a bolted-on bonus.
- System score = Σ(category % × weight). Two weight sets: base, and FE-active (FE 10%, other nine ×0.9). Update both sets in `11` §1 together when categories change.
- Tier thresholds: ≥80 Low · 53–79 Moderate · 27–52 High · <27 Critical. `tier_legacy` carries the old names (Healthy / High Risk) for one release and is never displayed.
- Coverage floor: fewer than half of attempted rows gradeable (measured + estimated) → the headline is **suppressed** with an `insufficient-signal` verdict instead of a number.
- Determinism: `score_fingerprint` hashes sorted facts (timings normalized out) + rubric/engine version + engine sha7 + snapshot versions + semantic flags (`strict`, indicator set, archetype, score policy). `runId`, timestamps, durations and machine identity are excluded, so identical content + identical release ⇒ identical fingerprint.

## Boundaries that CI enforces

- **The site carries no scan runtime** (`check:site-boundary`): the site's served graph must not reach `apps/scanner`, and must not use `node:fs`/`child_process` outside build tooling. Exemptions are declared in the check itself (`lib/reports.ts`, build scripts, tests).
- **Only `apps/scanner/src/scan/gh.ts` may call `fetch`** (`check:detector-isolation`); detectors get data through the read-only, byte-capped `readFile` and the injected GH client.
- **The surface app is separate from the scanner** (`check:surface-boundary`): scan and issue-write never share a process or token.
- **Every documented command must resolve after a clean install** (`check:bin-wiring`) and the committed Action dist must be byte-identical to its sources (`check:dist`).

## Style

Docs written as terse, evidence-forward spec (tables, bullet keys). Keep the same voice: no fluff, explicit flag/rationale pairs, decision IDs referenced by name. Matters more here than usual because the delay between edit rounds is long.
