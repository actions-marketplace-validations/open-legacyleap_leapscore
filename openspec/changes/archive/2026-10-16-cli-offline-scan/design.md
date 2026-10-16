## Context

See proposal.md Why. Current state: `apps/scanner/bin/scan.ts` only accepts `--repo owner/repo` and always runs `ingestRepoUrl` (GH-API) then `shallowClone` of the remote URL before the 25 file-based detectors; `sealScan` is already pure and shared. Only `gh.ts` may call `fetch` (enforced by `check:detector-isolation`). The 6 GH detectors (`VEL-06/08/09/10`, `SEC-07`, `TEST-08`) are cleanly separated from the 25 `ctx.readFile`/`readdir` detectors. `action/` is bypassed by the workflow, which `npx tsx`s the engine repo instead. Constraints: brief Req 2-4 (offline posture, determinism, trace), Input B (keep remote path), `--out` as a three-file directory.

## Goals / Non-Goals

**Goals:**
- One local-scan code path reusing phase-2 detectors + `sealScan` with no behavior change to remote scans.
- Testable offline postures: default allowlisted-GETs vs `--strict` zero-socket abort.
- Stable CI contract: out-dir, exits 0/1/2/3, tier rename with alias.

**Non-Goals:**
- New legacy-stack detectors (VB6/Delphi/.NET EOL tables) beyond sniff placeholders; Req 10 stays a follow-up.
- Vendored vuln/EOL DB update automation; v1 ships a snapshot with a documented refresh note.
- Single-binary packaging; v1 rewires the Action to checkout + local invocation, binary decision later.

## Decisions

- **Local orchestrator reuses phase-2 detector array, skips ingest/clone.** Alternative: fork detectors for local. Rejected: doubles maintenance; `ScanContext` already abstracts `readFile`, so binding it to `<path>` is the minimal seam. `gh` becomes optional/undefined locally; `docs08` dead GH branch is deleted.
- **`--strict` as abort, not degrade.** Alternative: silent fallback to `unknown`. Rejected: untestable promise. Abort gives the brief's "test fails on network call" a real target via a fetch spy; default mode degrades with a re-run hint instead.
- **No auto GH enrichment on local paths.** Alternative: detect github remote and enrich when a token exists. Rejected: surprises regulated users and breaks `--strict` mental model. Enrichment stays behind explicit `--repo`.
- **Tier rename with `tier_legacy` alias, no contract bump.** Alternative: hard rename + `CONTRACT_VERSION` 2. Rejected for v1: site, surface, and workflows parse `tier` strings; alias keeps them green while reports and CLI show brief-mandated Low/High.
- **Exit `3` for `--fail-under` trips.** Alternative: overload `2`. Rejected: conflates "fix the workflow invocation" with "fix the codebase"; `3` lets the Action map `core.setFailed` with score-vs-threshold messaging and keeps `if: always()` upload semantics intact.
- **Action becomes checkout-first thin wrapper.** Alternative: keep internal clone. Rejected: contradicts local-first posture and needs PAT for private targets scanned from their own repo; checkout + `scan .` needs no token for the default path.

## Risks / Trade-offs

- [Risk] Two enrichment behaviors (online vs `--strict` vendored) per detector → Mitigation: single fallback shape `unknown + re-run hint`; no per-detector network branching beyond the shared guard.
- [Risk] `readdir` order and `Promise.all` completion order make trace flaky → Mitigation: sort detector outputs by id before seal; trace keeps completion order but is excluded from score determinism.
- [Risk] `runId` includes wall-clock so same-tree reruns differ → Mitigation: documented as versioning not scoring; score is deterministic given facts, `runId` is not and must not be used as a content hash.
- [Risk] HTML/MD template drift from site renderers → Mitigation: CLI emitters own the funnel layout (band-first, top-5, CTA); site keeps the interactive scorecard; both read the same envelope + registry.
- [Risk] Tier alias confuses new consumers → Mitigation: one-release alias with removal noted in Open Questions; rubric `11` stays canonical for thresholds.

## Migration Plan

- Land CLI + specs behind existing `leapscore-scan` bin (additive flags, new positional); remote `--repo` output gains `report.html`/`report.md` alongside `report.json` with no exit change unless `--fail-under` is passed.
- Rewire one workflow to checkout + local Action as dogfood before marketplace publish; keep old `npx` path until the Action wrapper is verified.
- Remove `tier_legacy` in the following release after site/surface migrate to Low/High strings.

## Open Questions

- Default `--format`: all three files always, or allow `--format json` subset for CI speed?
- `--fail-on degraded` flag: include in v1 or defer until CI users ask?
- Vendored DB refresh cadence and owner (ties to brief open question on repo ownership).
