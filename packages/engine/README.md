# @leapscore/engine

Live scoring engine. Turns a public GitHub URL into a scored report (facts → statuses → scores → gates → headlines).

## Entry points

- `orchestrator.ts` — `runUnifiedScan(url, opts?)`: single indicator-count-driven budget (`budgetForIndicators`, clamp 10s–240s), GH-API + shallow clone (`--filter=blob:none`) under one deadline. Streams progress; seals exactly one terminal report (`complete`/`degraded`). This is what `apps/site/app/api/scan` calls.
- `orchestrator.phase1.ts` — `runPhase1Scan(url)`: GH-API-only path (no clone). Kept for the lightweight scan; the unified orchestrator skips the clone automatically when no clone-dependent indicator is requested.

## Pipeline

```
ingest (URL → owner/repo) → archetype (library/service/cli/infra/docs/agent-skills/…)
→ budget (per-indicator cost → budgetMs) → queue/runner/scheduler (GH + clone detectors)
→ facts (validated FactRecords) → scorer (status → 0–3 → rollup → gates → headlines)
```

## Key modules

| Module | Role |
|--------|------|
| `ingest.ts` / `gh.ts` | URL normalization; rate-limited GitHub REST client (shared bucket, retry/backoff) |
| `archetype.ts` | Repo archetype + plane inventory (`has_server/has_data/has_deploy/has_client/has_test`) via tree enumeration |
| `ecosystem.ts` / `clone.ts` | Manifest sniff (JS/TS, Python, Go, Java…); shallow clone, read-only `readFile` surface — detectors never execute repo code (D5) |
| `budget.ts` / `queue.ts` / `runner.ts` / `scheduler.ts` / `store.ts` | Indicator-count budget, work queue, detector runner, scheduling, fact store |
| `detectors/*.ts` | 31 engine-native detectors (`vel06/09/08/10`, `sec07/01/02/06/09/10`, `ecos01/02/03/05/06/07/08`, `arch01/05/08`, `test03/05/08`, `data01`, `docs01/03/04/08/09`, `perf02/06`). Each takes `(ctx, repo)` and returns a `FactRecord`; no raw `fetch`/`fs` (enforced by `check:detector-isolation`) |
| `scorer/applicability.ts` | 5-state lifecycle: N/A only via structural gate or exhaustive-surface proof; else `unknown`, never silent |
| `scorer/rollup.ts` | Category % + system score; renormalized headline (applicable categories) + canonical headline; gate capping (proven gates only) |
| `scorer/status.ts`, `scorer/phase1.ts`, `scorer/mvp.ts` | Status mapping, GH-only scoring, MVP-dual-headline (legacy) |
| `registry.ts` / `rubric.json` | Compiled rubric (indicators, weights, tiers, gates, applicability). **Generated** — `npm run compile:rubric` from root; never hand-edit |
| `detector.ts` / `facts.ts` | Detector context type; fact validation |

## Conventions

- Specs are canonical for implementation: `docs/specs/<NN_CATEGORY>/<ID>_*.md` (§0–§9). Predicates reference same-spec facts only; thresholds referenced by ID, never restated.
- Statuses: `measured` / `estimated` (clamped 1–2, `confidence: low|medium`) / `unknown`; `scope-limited` modifier on sampled runs.
- Live behavior spec: `openspec/specs/scan-phase-1`, `scan-phase-2`, `indicator-applicability`.

## Commands

- `npm test` (vitest) — unit + contract + dogfood tests in `__tests__/`
- `npm run lint` — `tsc --noEmit`
