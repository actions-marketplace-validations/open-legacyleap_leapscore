## 1. File contract and helpers

- [x] 1.1 Add repoSlug derivation and runId grammar utilities (normalizeRepo -> repoSlug `owner__repo`, ts file-safe, `runId = repoSlug__engineSha7__ts`, `meta` builder) with unit tests covering URL variants, case folding, dot/hyphen preservation, `__` split reversibility, and `unknown` fallbacks, and verify with `vitest run apps/site/lib/reports.test.ts`.
- [x] 1.2 Add engineSha7 resolver (LEAPSCORE_SHA -> VERCEL_GIT_COMMIT_SHA -> `git rev-parse --short HEAD` spawn fallback -> `unknown`) and a reports-dir helper (`path.join(process.cwd(),"reports")`, `mkdir --recursive`, `write/read/list`, `runId` validation rejecting `/` and `..`) with tests, and verify directory creation and traversal rejection in the same test file.
- [x] 1.3 Gitignore `apps/site/reports/` (add ` /reports/` to `apps/site/.gitignore` and ensure `reports/*.json` no longer shows in `git status`) and add `apps/site/reports/.gitkeep`.

## 2. Engine snapshot carries repoSha

- [x] 2.1 Extend `packages/engine/orchestrator.ts` terminal snapshots (both unified paths at ~131 and ~216) to include `scanned_commit` from `clone.commitSha` (clone path) or `"unknown"` (GH-only path), and verify with a unit test asserting `runUnifiedScan("https://github.com/o/r")` yields `snapshot.scanned_commit` defined.

## 3. Scan route writes envelope on done

- [x] 3.1 In `apps/site/app/api/scan/route.ts` capture `startMs`/`budgetMs` and `engineSha7` once, and on the `done` branch after `scoreMvp(facts)` build `{ meta, report }` (meta: repo/repoUrl/repoSlug/engineSha7/runId/ranAt/durationMs/budgetMs/repoSha/score/tier/status/engine_version/rubric_version/filename), `await fs.mkdir` + `fs.writeFile` before streaming the terminal `report` (attach `meta` for permalink), and verify by scanning a public fixture repo and asserting `apps/site/reports/<runId>.json` exists with matching `meta.score` and `report.headline.score`.
- [x] 3.2 Ensure refused paths write nothing and that a second scan for the same repo creates a distinct file (ts ms distinct), and verify by triggering a refused URL (e.g. `not_exist_12345/nope`) and asserting no file is created.

## 4. Run-history list page

- [x] 4.1 Add `apps/site/app/reports/page.tsx` (server component) that reads `reports/*.json`, parses each `meta`, skips invalid JSON with a server warning, sorts by `ranAt` desc, and renders columns repo/score/tier/ranAt/duration vs budget/engineSha7/repoSha/status/link plus empty state, and verify by seeding two fixture files + one truncated file and asserting the page renders two rows and the empty-state test passes.
- [x] 4.2 Add navigation entry to the list page (e.g. header or home affordance linking to `/reports`) and verify the link appears on `/` in a component/route test.

## 5. Persisted detail page

- [x] 5.1 Add `apps/site/app/reports/[runId]/page.tsx` that validates `runId` against the grammar, joins only under `process.cwd()/reports`, returns 404 on mismatch/missing (before any engine call), otherwise reads the envelope and renders the sealed report layout via a shared `ReportView` (dial, tier, coverage, gates, category scorecard, full table, deep-dive scope, provenance footer showing engineSha7/repoSha/ranAt/duration), and verify by requesting a seeded `runId` returns 200 with headline score and requesting an unknown `runId` returns 404.
- [x] 5.2 Surface `repoSha` (short 7) and `engineSha7` in the detail header/footer and ensure `GH-only` unknown chips render as `unknown`, and verify in the same detail route test.

## 6. Wiring and hardening

- [x] 6.1 Extract a shared `ReportView` if needed (from `LiveReportClient` sealed branch `LiveReportClient.tsx:365-448` / `report/sample/page.tsx:56-103` patterns) so list detail and sample share row/gate/category rendering, and verify `npm run build` succeeds and no duplicate row rendering regresses.
- [x] 6.2 Add coverage for malformed `runId` traversal attempts (`../`, `/`, `%2F`) returning 400/404 without touching outside `reports/`, and verify in a route-level test.
- [x] 6.3 Run `npm run lint && npm run test` from `apps/site` and `openspec validate --change persisted-reports --strict`, and fix any failures.
