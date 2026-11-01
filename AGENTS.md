# AGENTS.md

**LeapScore** — monorepo. The scoring engine turns a codebase (local directory, or any public GitHub repo) into a legacy/maintainability score. **The implementation is live**: scanner service + CLI, persisted-report presentation, rubric browser, GitHub Action, issue surfacing.

Docs that say "planning only" are stale — see "Implementation status". Current behavior lives in `openspec/`; indicator semantics and implementation contracts live together in the unified rubric catalog under `docs/rubric/indicators/`. **For scan/report behavior, `openspec/specs/*` is current truth.**

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
docs/rubric/           unified indicator catalog (canonical): one file per ID under
                       indicators/<NN_CATEGORY>/ combining semantics + implementation;
                       category indexes 01–10 + 11_WEIGHTS…CONFIG (shared config)
openspec/              live change specs — specs/ is current truth, changes/archive/* is history
tooling/checks/        detector-isolation · site-boundary · surface-boundary · bin-wiring ·
                       dist-freshness · schemas · documentation-structure
tooling/scripts/       compile-rubric (canonical → rubric.json + generated rubric.ts;
                       --check is the CI gate) · refresh-snapshots · snapshot-data
```

Root `package.json` workspaces: `apps/*`, `packages/*`, `action`. Run `npm run compile:rubric` / `npm run check:rubric-consistency` / `npm run check:schemas` / `npm run check:documentation-structure` / `npm run check:detector-isolation` / `npm run check:site-boundary` / `npm run check:bin-wiring` / `npm run check:dist` from root.

## Routine development commands

- `npm install` — install workspaces and build the CLI bundle through the root `prepare` script.
- `npm run build` — build all workspaces; `npm run build:cli` — rebuild the scanner bundle.
- `npm test` — run workspace Vitest suites; `npm run lint` — run workspace lint/type checks.
- Run repository boundary checks from the root; every documented command must resolve after a clean install.

## Implementation status (read this before "planning only" notes elsewhere)

- **Scanner is a standalone service, colocated engine + entries** (`apps/scanner`). The former `packages/engine` is gone; the engine lives under `apps/scanner/src/scan/` and its scoring under `src/scan/scoring/`. The scanner is **stateless**: no permanent disk, no served reports, no permalinks — the terminal `report` frame is the sole scan artefact.
- **Scan paths live:** `runUnifiedScan` (`src/scan/orchestrator.ts`) for remote targets — GH-API lane + shallow clone (`--filter=blob:none`) under one indicator-count-driven deadline (`budgetForIndicators`, clamp 10s–240s, plus a 240s wall-clock killer that fails the run without sealing). `runLocalScan` (`src/scan/local.ts`) scans a directory with the 25 clone-capable detectors — no clone, no GH-API. `orchestrator.phase1.ts` (`runPhase1Scan`) is the GH-API-only path, kept for back-compat.
- **Coverage live:** 31 detectors (6 GH-API + 25 clone/local) of 102 indicators; the other 71 seal as `not_implemented` and render as honest stubs. The 19-row MVP slice is a **subset** of what ships (its rationale is historical).
- **Terminal scoring is shared:** `src/scan/scoring/seal.ts` (`sealScan`) is the single composer for both the HTTP service and the CLI — score (frozen denominator by default), gates incl. the kill-switch cap, coverage, top blockers, derived next-band path, provenance manifest, `score_fingerprint`, `runId`.
- **Presentation:** the site never executes a scan. `/live` streams the scanner's NDJSON cross-origin; `/reports` + `/reports/[runId]` render **site-owned** history (v1 = one committed static fixture, no request-time filesystem reads). There is **no `/api/scan` and no site-side live provider** — `lib/provider.ts` is the sample seam only, and `lib/provider.live.ts` / `LiveReportProvider` no longer exist.
- **Surfacing is a separate app:** `apps/surface` turns a sealed envelope into labeled issues, warn-only, with its own token (`SURFACE_TOKEN`) so the scanner keeps `contents:read` only.
- **Decisions live in `openspec/`:** `openspec/changes/*` + `openspec/specs/*` carry everything built after the MVP (unified budget, deterministic scoring, measurement honesty, offline snapshots, legacy stacks, band path, baseline diff, score badge, release packaging). Superseded planning material survives only in git history.

## Two live doc trees

- `docs/rubric/indicators/` — the unified catalog: one canonical file per indicator combining rubric semantics and the implementation contract. **This is the product.**
- `docs/rubric/01`–`10` — category indexes (navigation only); `11_WEIGHTS_THRESHOLDS_CONFIG.md` — shared scoring configuration.
- `openspec/` — `openspec/specs/` is the current truth for scan/report behavior; `openspec/changes/archive/*` is history.

## The cardinal rule: canonical vs. derived views

The catalog is single-sourced (decisions D1/D3/F1):
- **Canonical — indicator semantics and implementation** (edit here): `docs/rubric/indicators/<NN_CATEGORY>/<ID>_<slug>.md` — identity, definition, impact, 0–3 criteria, remediation, applicability/inputs, detection recipe, fact schema, statusing/score predicates, gate hooks, failure/budget semantics, evidence, and scope. Shared numeric thresholds live in `11_WEIGHTS_THRESHOLDS_CONFIG.md`; indicator files reference them and never restate numbers.
- **Canonical — shared configuration** (edit here): `11_WEIGHTS_THRESHOLDS_CONFIG.md` — weights, scoring formula, tier thresholds, applicability vocabulary, gates.
- **Derived** (never hand-edit; match to canonical instead): `00_EXECUTIVE_RUBRIC.md`, `templates/*` score sheets, and the category index tables (`01`–`10`).

Consequences: changing an indicator's thresholds/status → edit its unified file *and* the matching derived row in `00_EXECUTIVE_RUBRIC.md` Part 2. Changing weights/FE-active logic → edit only `11` §1 and propagate. The consistency check is `npm run check:rubric-consistency` (= `compile-rubric.ts --check`: validates one-to-one IDs, category membership, unified identity metadata, shared configuration, and that `apps/scanner/src/scan/scoring/rubric.json` + `apps/site/lib/generated/rubric.ts` match the canonical files — IDs, names, effort tags, remediation coverage). Run `npm run compile:rubric` to regenerate; never hand-edit the generated files.

## Conventions for editing the unified catalog

- **Indicator IDs:** `CATEGORY-NN` where category ∈ {ECOS, ARCH, TEST, SEC, DATA, API, VEL, PERF, DOCS, FE}. Standard rows are contiguous `01…N`, deep-dive rows continue `N+1…` (decision C3). No padding to a fixed count — variable row counts per category are deliberate.
- **Every unified indicator file** carries the ten-section skeleton defined in `docs/rubric/README.md`, including: definition, why it matters, manifestations, detection method, objective metric, Yellow/Red flags with rationale, example symptom, blast radius, remediation, gold standard, **explicit 4-level `Scoring criteria (0–3, per global core-path taxonomy)`**, and `Verify effort:`.
- **Tags:** engine tier `A/B/C/D`, `Default status: measured/estimated/unknown`, `Scope/overlaps:` — every new/organized entry gets all three so applicability stays derivable. `Scope/overlaps` is how sibling indicators avoid double-counting; define it explicitly against the closest neighbors.
- **Verify effort symbols:** ⚡ ≤30 min · 🔶 ~2–4 h · 🔷 ~1–2 days. The same tag drives the next-band path's cost classes (`⚡` sprint · `🔶` quarter · `🔷` structural).
- **Gates:** G1–G8 are the absolute kill-switches. A `proven` gate **caps the sealed band at High** (a score already in `Critical` stays there — the cap is a ceiling, never a floor) and the cap is disclosed on the sealed headline (`gate_capped`, `uncapped_tier`, `capped_by_gates`). A gate whose source rows are all unknown/`not_implemented` is `unevaluable` and is stated, never silently counted as clear. Read `00_EXECUTIVE_RUBRIC.md` Part 0 before touching anything score-model related.
- **Skeleton/normative conventions:** the ten-section skeleton, full/reduced-form rules, statuses/clamp/confidence, strict N/A rule, budget classes, tool pinning, fact naming, and evidence grammar are defined once in `docs/rubric/README.md`.
- **Historical arbitration:** superseded per-indicator rulings are preserved in OpenSpec history, never as a second source of truth. The unified identity tables carry the values the compiled registry has always shipped; reconciling recorded divergences is a separate future change.

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
- **One canonical file per indicator** (`check:rubric-consistency`, `check:schemas`, `check:documentation-structure`): exactly 102 unified files under `docs/rubric/indicators/`, category indexes link all of them, detector schemas resolve to their indicator's §7 fact schema, current specs cite only paths that exist, and no redirect-only path is reintroduced.

## Style

Docs written as terse, evidence-forward spec (tables, bullet keys). Keep the same voice: no fluff, explicit flag/rationale pairs, decision IDs referenced by name. Matters more here than usual because the delay between edit rounds is long.
