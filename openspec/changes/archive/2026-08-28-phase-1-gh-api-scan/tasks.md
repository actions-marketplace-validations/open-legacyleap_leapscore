## 1. Scaffolding and Contracts

- [x] 1.1 Create `packages/engine/gh.ts` RateLimitedGhClient interface + token-bucket implementation and verify unit test for retry-after backoff passes
- [x] 1.2 Add `packages/engine/budget.ts` 10s AbortController helper and `packages/engine/facts.ts` RawFact envelope validation against `schema.json` and verify envelope validation test passes
- [x] 1.3 Extend `packages/engine/detector.ts` types for Phase-1-only `ScanContext` (gh, abort, toolVersions) and verify `tsc --noEmit` passes
- [x] 1.4 Create URL ingest `packages/engine/ingest.ts` (normalize `github.com/{o}/{r}` + `GET /repos` existence check) and verify ingest test for valid/invalid/private URLs passes

## 2. Phase-1 Detectors (GH-API only, fail-open)

- [x] 2.1 Implement VEL-06 bus-factor detector (GH commits API + contributors enrichment) and verify fixture test emits `vel06.bus_factor_repo` with evidence pointer
- [x] 2.2 Implement VEL-09 PR hygiene detector (`GET /pulls?state=closed` last 200, review coverage/size/bypass) and verify sampled-PR test for <10 PRs → unknown
- [x] 2.3 Implement VEL-08 manual-release detector (fetch `.github/workflows` list + decode CI YAML, detect cd_chain/rollback) and verify workflow-present vs no-CI test
- [x] 2.4 Implement VEL-10 branching topology detector (`GET /branches` + refs age/divergence) and verify stale-branch classification test
- [x] 2.5 Implement SEC-07 patch-cadence detector (dependabot config + open bot PR ages + lockfile hint) and verify bot-present vs na_when test
- [x] 2.6 Implement TEST-08 quality-gates detector (CI YAML gate inventory blocking vs advisory) and verify lint-only fixture test maps to measured row
- [x] 2.7 Ensure every detector honors `abort` + `api-budgeted` degrade (timeout/rate-limit → `unknown "rate-limited"` with `error.kind`) and verify abort-soon test for one detector

## 3. Orchestrator and Scorer

- [x] 3.1 Implement `runPhase1Scan(repoUrl)` orchestration: `ingest → fetch repo meta → parallel GH detectors under 10s budget → fact-store append` and verify hero-dial still seals when one detector times out
- [x] 3.2 Wire partial scorer: 6 measured facts + 96 unknown rows → `scoring.ts` BigInt rollup (VEL 4 + SEC 1 + TEST 1) and verify report `coverage.measured=6` and headline excludes unknown rows
- [x] 3.3 Gate handling: set G1/G2/G3/G8 to `needs-verification` unless Phase-1 evidence suffices and verify report gate table has 4 needs-verification lights
- [x] 3.4 Wire provenance `tool: gh-api` + `evidencePointers` per `06:4` row contract and verify `report.provenance.tool_manifest` lists GH endpoints

## 4. Site Wiring

- [x] 4.1 Add `apps/site/lib/provider.live.ts` Phase-1 ReportProvider that calls engine (server action) and maps facts to `IndicatorRow` and verify `provider.test.ts` for live vs fixture toggle
- [x] 4.2 Live page streams progress then report: `apps/site/app/live/page.tsx` wraps `LiveReportProvider` in Suspense/streaming (or `api/scan` NDJSON) with step list `Ingesting → Fetching → 6 checks → Scoring` + elapsed, replaces with hero dial/coverage/gates on seal, and verify `/live?repo=vercel/next.js` shows progress then `6/102`; `/report/sample` still fixture
- [x] 4.3 Keep fixture fallback: when `GH_TOKEN` absent or flag off, provider returns `sample.ts` and verify no regression in existing `score.consistency.test.ts`
- [x] 4.4 `Live` route alias + snapshot handling: `apps/site/app/report/live/page.tsx` re-exports live, `snapshot_refused`/`rate-limited` renders actionable message with retry, verify shareable URL round-trip (`/live?repo=o/r` ↔ `/report/live?repo=o/r`)
- [x] 4.5 Score CTA wiring: update `apps/site/components/url-box.tsx` `action="/live"` (normalize `github.com/o/r` → `o/r`, client `router.push`), verify paste `https://github.com/vercel/next.js/tree/canary` → lands on `/live?repo=vercel/next.js` and triggers live scan; invalid URL stays on homepage with inline error, no navigation

## 5. Quality Gates and Dogfood

- [x] 5.1 Add `detector.contract.test.ts` extension for the 6 Phase-1 manifests (envelope, never returns score/status, honors abort) and verify `vitest run` green
- [x] 5.2 Add `check:detector-isolation` guard for Phase 1 (no raw `fetch` outside `engine/gh.ts`) and verify lint passes
- [x] 5.3 Dogfood 5 real repos (including `django/django`) via Phase 1; log measured/unknown split and any `unknown "rate-limited"` occurrences and verify hero dial returns in <10s P95
