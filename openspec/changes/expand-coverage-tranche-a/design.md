## Context

MVP unified scan is `packages/engine/orchestrator.ts:runUnifiedScan` — single `budgetForIndicators(indicatorIds)` (`base 30s` if any `slow-dissolvable` else `5s` + Σ `fast=5s/api=10s/slow=40s` clamped `[10s,240s]`), GH-API detectors then `shallowClone --filter=blob:none` → `sniffEcosystems` → `phase2Detectors[]` under same `AbortSignal`. 19 detectors wired; registry `rubric.json` already has 102 rows and `report-rendering` already registry-driven. See proposal for why Tranche A is next.

## Goals / Non-Goals

**Goals:**
- 31/102 measured coverage (8 categories) with zero `slow-dissolvable` and zero new external tool installs.
- Reuse existing parsers/planes so each new detector is ~30 LOC grep/tree-enum; budget stays ≤240s.
- Keep report/gate contracts additive — no breaking change to scorer tiers or proven-gate caps.

**Non-Goals:**
- Tranche B estimated heuristics (ARCH-09/10 etc.), heavy `slow-dissolvable` (ARCH-02/03/04, knip-full), B `PART` CI-history, any C/D, FE annex scoring. Deferred explicitly.
- New tool binaries (`knip`, `syft`, `license-checker` full SBOM) — ECOS-06 uses lockfile counts only.
- Live rendering of bundle/perf — PERF-02/06 are presence-only.

## Decisions

**Decision: All 12 wire into existing `phase2` clone lane (not GH-API lane)**
- Rationale: 11 are `static-src` (tree enum only); DOCS-08 also touches `GET /releases` but can be satisfied from cloned `CHANGELOG.md` + optional GH releases fallback — single code path, no split budget. Alternative considered: split DOCS-08 to Phase1 lane — rejected, adds GH-API coordination for one row.
- Consequence: `phase2Detectors[]` grows 13→25; GH lane stays 6; budget still one clamp.

**Decision: `budget.ts` entries all `fast` except DOCS-08 `api-budgeted`**
- Rationale: Every added detector is tree-enum/grep/YAML parse with no network or child process. DOCS-08 alone may call `GET /repos/{o}/{r}/releases` — mark `api-budgeted` so its rate-limit exhaustion maps to `unknown "rate-limited"` per `docs/specs/README.md §2.4`. Alternative: mark all `fast` — rejected, DOCS-08 would hide rate-limit degradation.
- Consequence: `budgetForIndicators(31)` = `30 + 18*5+8*10+5*40?` Actually Tranche A adds 11×5 +1×10 = 65s → 19(≈?)+65 still <240 clamp, no formula change.

**Decision: ECOS-06 "bloat" ships as measured via lockfile graph only (transitive count + duplicate versions), no `knip`/`vulture` unused-direct run**
- Rationale: Full dead-dep detectors are `slow-dissolvable` and ecosystem-specific; lockfile counts are exhaustive-by-construction and already `measured` per spec `ecos-06` `measured_when: lockfile parsed`. `pct_direct_unused` left null with `scope_limited` note when tool unavailable — keeps `measured` status via `BUDGET_CLASS fast`. Alternative: run `knip` — rejected per resource rule.
- Trade-off: Undercounts unused-direct vs full scan, but sibling ARCH-04 already owns dead-code signal per `Scope/overlaps`.

**Decision: ECOS-08 and FE-independent — reuse ECOS-01 endoflife.date cache**
- Rationale: Framework version already extracted for ECOS-01 (`.nvmrc`/`Dockerfile`/`package.json` engines); ECOS-08 just maps same version through `endoflife.date` — one fetch, two facts.

**Decision: SEC-10 reuses TEST-08 CI-YAML parse**
- Rationale: Both inspect `.github/workflows/*.yml` for job presence (`sast`, `secret-scan`, `trivy`, `gitleaks`, `osv-scanner`) + `continue-on-error` blocking semantics. Parse once, share fact cache via existing `cache: {get,set}` in `ScanContext`. Alternative: separate parse — wasteful.

## Risks / Trade-offs

- **Heuristic false-positive on DOCS paths** (`docs/adr` at `decisions/`, `RFCs/`, `doc/adr`) → Mitigation: enumerate candidate dirs from spec §2 matchers, accept first hit; absence emits `0` (signal) not `unknown`; scorer maps missing ADRs to 0 per DOCS-01 predicate.
- **Non-standard CHANGELOG names** (`HISTORY.md`, `NEWS`) → Mitigation: inventory `CHANGELOG*` + `HISTORY*` + `NEWS*` + GH releases fallback; `measured_when: tree enumerated` stays true.
- **Lockfile absent (no package manager)** → Mitigation: ECOS-06/08 emit `unknown` with `unknown_measure_path`, never `na_when` (applicability clause-b); category denominator excludes? No — ECOS still scores on other rows.
- **Budget creep with 31 fast detectors on huge monorepo** → Mitigation: detectors are `fast` but tree enum is shared; each does `readFile` via `ScanContext.readFile` capped by `byteCap=4MiB` + `withBudget` abort; worst case individual detector returns `unknown "budget-exceeded"` and overall still seals once.
- **Report category table grows from 5 to 8 rows** → Mitigation: UI already renders dynamic `categories[]` from `rubric.json`; no hardcoded category list (`category-section.tsx:113` generic).

## Migration Plan

1. Land detectors + budget entries behind feature flag `indicatorIds` allowlist — default 19 still default, canary 31 via `runUnifiedScan(repo,{indicatorIds: MVP_IDS.concat(TRANCHE_A_IDS)})`.
2. Run 5-repo quiz (03 last) on both 19 and 31 to assert: DOCS/PERF/DATA now `measured` not `unknown`, no regressions on existing 19 scores, budget still <240s on large repo (vercel/next.js).
3. Flip default `MVP_IDS` → 31; bump `rubric_version` to `docs/rubric@tranche-a`. Rollback is single commit revert of `MVP_IDS` constant.
4. Update `apps/site/lib/sample.ts` sample to 31/102 (django 58/100 unchanged — category weights still `11 §1` base set).

## Open Questions

- Whether to include FE-01 (framework EOL) as cheap 13th when client detected — trivial `fast` `measured`, reuses endoflife.cache, but spec says conditional FE. Defer to FE-active re-eval; not blocking Tranche A.
- Exact DOCS-09 "docs-as-code" CI step patterns to match (`docs build`, `link-check`, `vale`) — tune against 5-repo sample without changing requirements.
