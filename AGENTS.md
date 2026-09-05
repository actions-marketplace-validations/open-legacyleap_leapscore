# AGENTS.md

**LeapScore** — monorepo. Scoring engine turns a GitHub URL into a legacy/maintainability score. Planning docs + implementation co-exist; **the implementation is live** (unified GH-API + clone scan, persisted reports, rubric browser). Docs that still say "planning only" are stale — see "Implementation status" below.

## Layout (monorepo)

```
docs/rubric/         rubric (canonical) — 102 indicators + 11_WEIGHTS… (was CODEDEBT_AUDIT_RUBRIC)
docs/specs/          per-indicator impl specs (F1) — 102 files + README (was SPECS)
docs/plans/          product/engine specs (00 indexes, 01→13 incl. website/GitHub-surface/MVP slice; was PLANS)
openspec/            live change specs — specs/ is current truth for scan/report behavior; changes/archive/* is history
apps/site/           Next.js site — marketing + sample report + live scan (/live) + persisted reports (/reports/[runId]) + rubric browser (/rubric)
packages/engine/     scorer, orchestrator (+ orchestrator.phase1), registry, budget, archetype, clone, gh, ingest, queue, runner, scheduler, store, detectors/*, scorer/*, rubric.json (was /engine)
packages/detectors/  102 detector folders — manifest.json + schema.json each; 3 with standalone detector.ts (arch-09, sec-02, sec-03); engine-native detectors live in packages/engine/detectors/* (31 indicators)
tooling/checks/      detector-isolation (enforced), rubric-consistency + schemas (stubs — real check is compile-rubric --check)
tooling/scripts/     compile-rubric (canonical → rubric.json + generated rubric.ts; --check is the CI gate)
out/                 local architecture-diagram artifacts (not source)
```

Root `package.json` workspaces: `apps/*`, `packages/*`. Run `npm run compile:rubric` / `npm run check:rubric-consistency` / `npm run check:detector-isolation` from root.

## Implementation status (read this before "planning only" notes elsewhere)

- **Engine live:** `packages/engine/orchestrator.ts` (`runUnifiedScan`) — single indicator-count-driven budget (`budgetForIndicators`, clamp 10s–240s), GH-API + shallow-clone (`--filter=blob:none`) under one deadline, archetype classification (`archetype.ts`), 5-state applicability (`scorer/applicability.ts`), rollup with renormalized + canonical headlines (`scorer/rollup.ts`). `orchestrator.phase1.ts` (`runPhase1Scan`) is the GH-API-only path.
- **Coverage live:** 31 engine-native detectors (`packages/engine/detectors/*.ts`); `/api/scan` streams NDJSON (`meta → progress → report`) with single-flight coalescing. MVP slice (`docs/plans/13`, 19 rows) is therefore a **subset** of what ships — see tranche-a openspec change.
- **Site live:** `/live` (live scan UI), `/report/live`, `/reports` + `/reports/[runId]` (persisted runs via `lib/reports.ts`), `/rubric` (compiled-registry browser), `/api/reports/[runId]`. `LiveReportProvider` (`lib/provider.live.ts`) maps engine facts → report; `provider.ts` is the sample seam.
- **Decisions live in two places:** `docs/plans/00_MASTER_INDEX.md` (D1–D9, A1–F1, W1–W14) for product/rubric history **plus** `openspec/changes/*` + `openspec/specs/*` for everything built after the MVP (unified budget, persisted runs, trace, remedies, tranche-a, archetype/applicability). Check openspec first for scan/report behavior; plans docs are the parent rationale.

## Three doc trees, different rules

- `docs/rubric/` — the rubric: 102 indicators across 10 categories + config. **This is the product.**
- `docs/plans/` — product/engine specs. Read order matters: `00` indexes everything and logs decisions; 01→10 have a hard dependency chain (`00_MASTER_INDEX.md` line 25). Navigation start: `docs/plans/00_MASTER_INDEX.md` + `docs/rubric/README.md`.
- `docs/specs/` — per-indicator **implementation specifications** (decision F1): one file per indicator under `<NN_CATEGORY>/<ID>_<slug>.md`, plus a normative `README.md`. All 102 exist.

## The cardinal rule: canonical vs. derived views

The catalog is single-sourced (decisions D1/D3/F1):
- **Canonical — semantics/thresholds** (edit here): encyclopedia files `01_…`–`10_…` (per-indicator truth) and `11_WEIGHTS_THRESHOLDS_CONFIG.md` (weights, scoring formula, tier thresholds, gates).
- **Canonical — implementation** (edit here): `docs/specs/<NN_CATEGORY>/<ID>_*.md` — inputs, detection recipes, fact schemas, statusing predicates, score-mapping predicates, gate hooks, failure/budget semantics. Specs **reference** encyclopedia thresholds by ID; they never restate numbers.
- **Derived** (never hand-edit a number; match to canonical instead): `00_EXECUTIVE_RUBRIC.md`, `templates/*` score sheets, the category-weight tables in each encyclopedia `01`-`10` header, and `docs/plans/03_ENGINEERABILITY_MATRIX.md`.

Consequences: changing an indicator's thresholds/status → edit the encyclopedia row *and* the matching row in `00_EXECUTIVE_RUBRIC.md` Part 2 *and* the spec's §0/§4/§5 if detectability or predicates change. Changing weights/FE-active logic → edit only `11` §1 and propagate. The consistency check is `npm run check:rubric-consistency` (= `compile-rubric.ts --check`: asserts `packages/engine/rubric.json` + `apps/site/lib/generated/rubric.ts` match the encyclopedia — IDs, names, effort tags, remediation coverage). Run `npm run compile:rubric` to regenerate; never hand-edit the generated files.

## Conventions for editing the rubric

- **Indicator IDs:** `CATEGORY-NN` where category ∈ {ECOS, ARCH, TEST, SEC, DATA, API, VEL, PERF, DOCS, FE}. Standard rows are contiguous `01…N`, deep-dive rows continue `N+1…` (decision C3). No padding to a fixed count — variable row counts per category are deliberate.
- **Every encyclopedia entry** must carry the full field set seen in any existing entry: definition, why it matters, detection method, objective metric, Yellow/Red flags (`Yellow flag`/`Red flag` lines, with rationale), example symptom, blast radius, remediation, gold standard, **explicit 4-level `Scoring criteria (0–3, per global core-path taxonomy)`**, and `Verify effort:` tag.
- **Tags:** engine tier `A/B/C/D`, `Default status: measured/estimated/unknown`, `Scope/overlaps:` — every new/organized entry gets all three so the derived matrix stays derivable. `Scope/overlaps` is how sibling indicators avoid double-counting; define it explicitly against the closest neighbors.
- **Verify effort symbols:** ⚡ ≤30 min · 🔶 ~2–4 h · 🔷 ~1–2 days.
- **Gates:** G1–G8 are the absolute kill-switches (Red Flag → verdict capped at "High Risk / Obsolete"). Read `00_EXECUTIVE_RUBRIC.md` Part 0 before touching anything score-model related.

## Conventions for editing docs/specs/

- **Skeleton is mandatory:** the 10 sections (§0 Identity … §9 Scope/overlaps echo) defined in `docs/specs/README.md` §1. Tier C/D rows ship a reduced form (Identity + Emission text + Scope echo) — their output is `unknown` + "what it takes to measure".
- **Normative preamble:** `docs/specs/README.md` §2 fixes statuses/clamp/confidence, the strict N/A rule (structural gate or exhaustive-surface absence only), budget classes, tool pinning, fact naming, evidence grammar. Specs cite it; they don't restate it.
- **Drift protocol (F1):** when an entry's Definition/Detection text contradicts its own header tags or `docs/plans/03`, specs arbitrate and log every correction in `docs/specs/README.md` §4. The pending reconciliation commit applies those corrections back to encyclopedia header lines and regenerates `03` — **65 corrections are currently logged and unapplied**; until then, spec values win over both sources.

## Weights & scoring model (quick recap)

- Category % = (Σ applicable row scores ÷ applicable count × 3) × 100; N/A rows excluded from both numerator and denominator. Deep-dive rows **fold into** the category when run — never a bolted-on bonus.
- System score = Σ(category % × weight). Two weight sets: base, and FE-active (FE 10%, other nine ×0.9). Update both sets in `11` §1 together when categories change.
- Tier thresholds: ≥80 Healthy · 53–79 Moderate · 27–52 High Risk · <27 Critical.

## Decisions & governance

- `docs/plans/00_MASTER_INDEX.md` holds the Decisions Log (D1–D9 for the product, A1–F1 for the rubric redesign, W1–W14 for the website) and Open Questions. Post-MVP build decisions live in `openspec/changes/*` + `openspec/specs/*` (unified budget, persisted runs, trace, remedies, tranche-a, archetype/applicability). New decisions get appended with `# · Decision · Rationale · Status`; agreed ones become the format `**AGREED**`.
- Threshold/weight adjustments are logged in `11` §5 (calibration log) with date, ID, field, old/new, evidence. Don't silently tweak a number.
- Product status: **implementation live** — engine (`packages/engine`), site (`apps/site`), detectors (`packages/detectors`, `packages/engine/detectors`). `docs/plans/05_DETECTION_ENGINE_BLUEPRINT.md` is the parent blueprint; `openspec/specs/*` is current truth for scan/report behavior.

## Style

Docs written as terse, evidence-forward spec (tables, bullet keys). Keep the same voice: no fluff, explicit flag/rationale pairs, decision IDs referenced by name. Matters more here than usual because the delay between edit rounds is long.