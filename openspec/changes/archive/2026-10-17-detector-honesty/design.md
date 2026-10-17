## Context

See proposal.md (Why) for motivation. Current state that shapes the approach:

- 25 local detectors (`apps/scanner/src/scan/local.ts:43-54`) plus 6 GH-only rows (`GH_ONLY_IDS`, `local.ts:41`) are graded by `scoreMvp` (`scoring/scorer/mvp.ts`). The extra rows grade through `TRANCHE_SCORERS` with a `: 2` fallback (`mvp.ts:330-336`), and the default reason string interpolates the fact's provenance tool (`mvp.ts:333`).
- `makeProvenance()` hardcodes `tool: 'gh-api'` for every caller (`detectors/common.ts:65-72`); the honest sibling `makeDetectorProvenance()` is defined and never called; SEC-09 builds honest provenance inline (`detectors/sec09.ts:28`), which is the ready-made shape for the rest.
- `DETECTOR_TOOL_VERSIONS` (`common.ts:9-38`) registers tools the build never runs (`lizard`, `jscpd`, `syft`, `trivy`, `pyramid`, `endoflife.date`). The only binary spawned anywhere is `git` (`local.ts:135`, `clone.ts:27,41`).
- Verified live baseline — `scan packages/contracts`: headline `28.25/High`, coverage `22 measured / 0 estimated / 6 unknown` plus 3 not-applicable; **13 rows** carry `evidence.tool: "gh-api"`, and ARCH-01/05/08 are `measured` at score 2 with reason `… — evidence via gh-api — score 2.`. The 6 unknowns are the GH-only rows.
- The specs already demand most of what the implementation skips: ARCH-05 "via `git log --name-only`" (`scan-phase-2:147-148`), TEST-03 "`never auto-measured`, `estimated` only" (`scan-phase-2:155`), and tranche-A rows graded "from the indicator's spec §5 predicate (not a hardcoded `2`)" (`scan-phase-2:272-274`). The bug is that the spec clause "report `measured` when the tree is enumerable" (`scan-phase-2:169`) was read as licence to fabricate magnitudes.
- Constraints: the default-run network posture belongs to `offline-default`; site fixtures and `fingerprint_version` are already consumed; the single-binary/container packaging decision (`release-packaging`) bounds how large the vendored data may be.

## Goals / Non-Goals

**Goals:**

- No row is graded from a hardcoded magnitude; no row cites a producer that did not run.
- The cheap offline signals the specs already describe become real measurements (git churn, test classification, lockfile/manifest-derived facts), so honest demotion stays bounded.
- Offline reference data exists, is versioned and refreshable, and participates in the fingerprint; absent data is `unknown`, never a guess.
- The score change from demotion is explainable per row and disclosed, so the eventual weights sign-off happens against honest output.

**Non-Goals:**

- Network posture (default allowlisted GETs vs zero-socket) — owned by `offline-default`.
- Building language analyzers we do not already ship: complexity/duplication are demoted, not reimplemented. A built-in analyzer is a documented follow-up.
- Legacy-stack ingestion (.NET/VB.NET/VB6/Delphi) — `legacy-stacks`.
- The public methodology narrative and the weights sign-off itself.
- Snapshot refresh *cadence* ownership and packaging size — ops and `release-packaging`; this design fixes the interface, not the number.

## Decisions

### D1: Measure-or-unknown, gated by a "cheap signal" bar

A signal is implemented in this change if and only if it is derivable from (target tree ∪ git history ∪ vendored snapshot) with no network and no external binary the release does not ship, within the indicator's budget class. Everything else demotes to `unknown` with a "what it takes" note.

- Alternative (rejected for v1): implement built-in complexity/duplication analyzers before release. This is the note's "measure the top signals" shape; it keeps ARCH-01/08 measured but is days of work per analyzer and mixes "honest" with "new capability". Recorded as the follow-up that converts two `unknown` rows back to `measured`.
- Rationale: the brief's thesis is credibility. A thin honest report beats a rich wrong one, and demotion is reversible row-by-row as analyzers land.

### D2: Per-row verdict for the 25 local rows (+GH-only)

| Row | Today | Verdict | Producer |
|---|---|---|---|
| ARCH-05 Churn | constant (100 commits / 0.2) | **MEASURE** — `git log --name-only` + bugfix regex | `git` |
| ARCH-01 Complexity | constant (200 methods) | **DEMOTE** unknown | what-it-takes: analyzer |
| ARCH-08 Duplication | constant (7%) | **DEMOTE** unknown | what-it-takes: analyzer |
| TEST-03 Pyramid | constant (10/5/2), `measured` | **MEASURE as `estimated`** (spec: never auto-measured) | `test-classify` |
| TEST-05 Skipped | constant (2/100) | **MEASURE** marker grep (+ blame age where history exists) | `test-scan` |
| ECOS-06 Bloat | presence-gated constant | **MEASURE** lockfile counts | `lockfile-parse` |
| ECOS-02 Drift | constant (12% behind) | **MEASURE** pin ratio from lockfile/manifest; behind-majors only from snapshot metadata, else that sub-fact `unknown` | `lockfile-parse` (+`metadata-snapshot`) |
| ECOS-01 Runtime EOL | constant | **MEASURE** from vendored EOL table | `eol-snapshot` |
| ECOS-03 Abandoned | constant | **MEASURE** last-release date from metadata snapshot if it ships, else **DEMOTE** | `metadata-snapshot` |
| ECOS-05 License | constant | **MEASURE** direct-dep licenses from lockfile/manifest; transitive absent → `unknown` | `lockfile-parse` |
| ECOS-07 Lockfile integrity | presence-gated | **MEASURE** lockfile presence/integrity signals | `lockfile-parse` |
| ECOS-08 Lock-in | presence-gated constant | **MEASURE** framework + support status from manifest + EOL snapshot | `eol-snapshot` |
| SEC-01 Vulns | `findings: [], tools:['trivy']` | **MEASURE** locked versions × vendored advisory snapshot (unscanned when absent) | `advisory-snapshot` |
| SEC-02 Secrets | constant empty | **MEASURE** built-in documented rule set over tree (+history) | `secret-rules` |
| SEC-06 Transitive chains | constant | **DEMOTE** unknown (decided: no depth≥2 resolver in v1) | resolver |
| DOCS-01/03/04/08/09, PERF-02/06, DATA-01, SEC-09/10 | real enumeration + literal residuals | **KEEP measured**; residual literals (`newest_days`, `last_verified_days`, `newest_adr_days`) become real reads or are omitted | enumerators |
| VEL-06/08/09/10, SEC-07, TEST-08 | GH-only; `unknown` locally | **KEEP `unknown`** in local scans; never a constant 2 | GH-API (remote only) |

### D3: Vendored snapshot plan

Contents: (a) a curated runtime/framework end-of-life table; (b) a pinned advisory subset scoped to the ecosystems whose manifests we parse (keyed by package + affected range + severity + age); (c) optionally a package metadata table (latest version, last release date) for drift/abandonment, included only if the size budget from `release-packaging` allows.

- Versioning: every dataset carries a version id (or content hash); ids join provenance and the score fingerprint, so a refresh is a deliberate, visible score input.
- Refresh: a documented, reproducible build script; no manual editing of dataset files.
- Honesty fallback: a datum absent from the snapshot yields `unknown` + a refresh/re-run hint — never a permissive default (this is also what makes `scan-local`'s "vendored snapshots" claim true).
- Scope decided for v1: ship (a) and (b). SEC-06 is demoted (no depth≥2 resolver in v1). (c) is packaging-dependent and stays an Open Question.
- Alternative (rejected): fetch at scan time. Correct for the opt-in online posture, wrong for the offline default; the online path is `offline-default`'s to define.

### D4: Evidence grammar and the producer registry

`evidence` becomes `{tool, tool_version, pointers[], facts}`; `tool` MUST be in the registry of producers runnable in this build; `report.provenance.tool_manifest` records what actually ran. `makeProvenance()`'s `gh-api` hardcode is replaced (adopt `makeDetectorProvenance()` or delete it), and the `: 2` fallback plus the "enumerable ⇒ measured" reading are removed. Names implying an unrun binary (`lockfile+rg`) are renamed to what ran (`lockfile-parse`).

- Alternative (rejected): keep `gh-api` as a legacy alias for local rows. It is a falsehood in the one artifact a sceptic reads first.

### D5: Fingerprint era for measurement-semantics changes

Bump `fingerprint_version` so pre/post fingerprints are not equated. Snapshot ids become inputs. Site fixtures are regenerated; `--score-policy legacy` is retained for one release as the escape hatch.

- Alternative (rejected): no bump. Consumers would silently compare incomparable scores.

### D6: Coverage arithmetic and the floor

Verified baseline: 22 measured of 28 applicable rows (the 6 unknowns are GH-only rows; 3 rows not-applicable). D2's demotions move up to ~8 rows out of `measured`: small repos land near the 0.5 coverage floor, and large repos fall below it, because the sampleN gate already sends ARCH-01/08/ECOS-05 to `unknown` there. **Decided:** count `estimated` toward the floor and keep the floor at its current value, so honest demotion does not suppress the headline on the large repos the release checklist must validate. The floor *value* remains a tunable constant owned with the weights sign-off; implementing enough cheap signals (D2) keeps projected coverage above it.

- Alternative (rejected): renormalize away demoted rows, or drop the floor. Both hide unmeasured work — exactly the "black box" the brief forbids.
- Alternative (rejected): strictly measured-only counting at 0.5. Honest, but it prints `insufficient-signal` instead of a score on exactly the corpora the release checklist requires, which no stakeholder can act on.

### D7: Invariants the change must hold

1. Provenance registry test: no sealed row cites a producer outside the runnable set, and every cited producer appears in `tool_manifest`.
2. Measure-or-unknown golden fixtures: every graded number is re-derivable from the fixture, and a dedicated demotion fixture asserts `unknown` + what-it-takes.
3. Determinism preserved: repeat-run fingerprint equality still holds after the era bump.
4. Dogfood corpus before/after: coverage and headline recorded per row in the change notes so the movement is explainable.

## Risks / Trade-offs

- [Risk] Honest demotion lowers or suppresses scores on the very estates the release targets (legacy, large) → Mitigation: reference scores stay in JSON; coverage and deep-dive list the demoted rows; D6's floor policy is decided before release; cheap signals are measured to hold coverage up.
- [Risk] The demo report gets visibly thinner → Mitigation: the brief's thesis is credibility; README/methodology frame the honest thin report as the feature.
- [Risk] Vendored advisory deprecity grows the release artifact (packaging) → Mitigation: scope to parsed ecosystems, compress, decide the budget with `release-packaging`.
- [Risk] Fingerprint era bump invalidates stored/site reports → Mitigation: versioned era, regenerate fixtures, keep `--score-policy legacy` for one release.
- [Risk] Lockfile parsers across many ecosystems are unbounded → Mitigation: parse only what the ecosystem sniffer detects; an ecosystem without a parser is `unknown` (honest), not a partial guess.
- [Risk] Demoting GH-only rows in local scans shifts coverage and can trip the floor → Mitigation: that is already today's behaviour (they are `unknown`); the change only guarantees they are never graded from a constant.
- [Risk] SEC-02's built-in rule set is weaker than a mature scanner → Mitigation: rules and coverage are documented and disclosed in the report; `gitleaks`/`trufflehog` widen it when present; history-unscanned is stated, never assumed clean.

## Migration Plan

1. Land provenance truthfulness + producer registry + the registry test — additive, no score change; verify no local row cites `gh-api`.
2. Implement the cheap measures from D2; verify per-row score movement is explainable on fixtures and the dogfood corpus.
3. Demote the remaining rows; bump `fingerprint_version`; regenerate site fixtures; keep `--score-policy legacy` for one release.
4. Ship the vendored snapshots with their refresh script; wire snapshot ids into provenance + fingerprint last, so the fingerprint change is attributable to the data, not the code.

Rollback: steps 1–2 and 4 are additive; step 3 is the flag-worthy cutover (`--score-policy legacy` restores the previous headline policy).

## Open Questions

- Whether the optional package-metadata table ships or is cut for size (with `release-packaging`); if cut, ECOS-02's behind-majors and ECOS-03 demote. The specs already permit either.
- Whether a built-in complexity/duplication analyzer is a follow-up change or is replaced by an opt-in online path — this is the change that would convert ARCH-01/08 from `unknown` to `measured`.
- Exact ecosystem breadth of the advisory subset (bounded by the manifest ecosystems the sniffer detects) and the refresh cadence owner — both answerable during implementation without changing the specs or task breakdown.
