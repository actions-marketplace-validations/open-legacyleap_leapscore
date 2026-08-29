## Context

Today `GET /api/scan?repo=owner/repo` (`apps/site/app/api/scan/route.ts:4-96`) streams NDJSON from `packages/engine/orchestrator.ts:runUnifiedScan` — meta/progress/report/refused — then discards everything. `LiveReportClient.tsx:89-225` fetches that stream, seals once, and renders the dial/categories/gates already defined by `lib/types.ts:120` and `report-rendering` spec. There is no `reports/` directory anywhere; every refresh pays the full GH+clone budget again. The engine already fetches the scanned repo's HEAD (`clone.ts:40`, threaded into `FactRecord.commitSha`), but `orchestrator.ts:131/216` never surfaces it in `snapshot`; the scanner's own HEAD is nowhere captured. See proposal.md for why durable runs matter.

## Goals / Non-Goals

**Goals:**
- Make every completed scan addressable as a file and as a URL, and make the run list derivable from the filesystem alone.
- Keep the change contained to `apps/site` (+ one snapshot field in `packages/engine`) with no DB, no pruning, no background jobs.
- Enforce fresh-vs-cached semantics strictly: no `runId` = scan and write; `runId` = read from disk, no engine call.

**Non-Goals:**
- Cross-deploy durability (Vercel ephemeral FS stays ephemeral — noted in proposal Impact).
- Content-addressed dedup by `repoSha` (filtered later from `meta.repoSha` if wanted).
- Intermediate progress persistence — only the sealed `done` report is stored.
- Auth or access control on reports (public repo scans are public artifacts).

## Decisions

### D1 — runId grammar and filename

`runId = <repoSlug>__<engineSha7>__<ts>` with `repoSlug = owner__repo` (lowercased, dots+hyphens preserved, double-underscore separator), `engineSha7` 7-char scanner HEAD (`unknown` fallback), `ts` file-safe ms ISO `YYYY-MM-DDTHHMMSS-mmmZ`. File is `<runId>.json` flat in `apps/site/reports/`.

*Why repoSlug first:* groups files per repo (`vercel__next.js__*`), one glob per list filter. *Why double-underscore:* `_` is illegal in GH owner/repo, so `__` split is lossless vs single `-` which collides with names containing `-`. *Why engineSha in the name:* per user decision, the scanner version is part of identity; same repo scanned by different engine commits are distinct runs. *Why timestamp ms:* avoids collision for two fresh runs in the same second.

*Alt rejected:* hierarchical `reports/owner/repo/<ts>.json` — deeper dirs, recursion, traversal risk; flat keeps one `readdir`.

### D2 — storage location

`apps/site/reports/` inside the Next app's `process.cwd()`.

*Why:* both the writer (`app/api/scan/route.ts`) and readers (`app/reports/page.tsx`, `app/reports/[runId]/page.tsx`) resolve via `path.join(process.cwd(),"reports")` without `../../` from root. Falls back to `.next` output tracing naturally.

*Alt rejected:* `<repo-root>/reports/` — requires cwd math and leaks app concerns to monoreo root.

### D3 — envelope shape

Single file per run: `{ meta, report }`. `meta` is the list-page header; `report` is the full `Report` already sent on the stream (`route.ts:68-82`).

*Why single file:* no secondary index to keep in sync; `readdir` + parse `meta` per file is O(N) and fine for hundreds of local runs. If it grows past a few thousand, add a cached `.index.json` later without changing the contract.

### D4 — where the write happens

In `app/api/scan/route.ts` on the `done` branch, after `scoreMvp(facts)` and before `send({type:"report"})`. Compute `durationMs = Date.now()-startMs`, resolve `engineSha7` (env/ git fallback), derive `repoSha` from the richest `FactRecord.commitSha` (or `unknown` for GH-only), build `meta`, `await fs.mkdir(reports,{recursive:true})` + `fs.writeFile`, then stream the terminal report with `meta` attached for the client's permalink to `/reports/<runId>`. Do not write on `refused`.

*Alt rejected:* engine-level `ReportStore` in `packages/engine/store.ts` — would be more swappable but requires cross-package `fs` wiring and an engine-to-site contract change. Keeping the write in the route is minimal; a store abstraction can be extracted later when hosted persistence needs it (Vercel Blob) by moving `writeReport` into a shared utility with the same file shape.

### D5 — engine snapshot carries repoSha

Add `scanned_commit` to the snapshot yielded on `done` (`orchestrator.ts:131/216`) populated from `clone.commitSha` (clone path) or `unknown` (GH-only path). The route reads it for `meta.repoSha` and echoes it in `report.snapshot`.

*Why:* list page can show "scanned @ a1b2c3d" without parsing facts; facts already carry per-detector `commitSha` but not a single repo HEAD.

### D6 — fresh-vs-cached routing

- `GET /api/scan?repo=` — **always scans**, always writes a new runId. No read-through cache.
- `GET /reports` — reads `reports/*.json` manifests only, never calls the engine.
- `GET /reports/[runId]` — reads exactly that file; malformed `runId` or missing file 404s; file is rendered with the sealed report UI (`CategorySection`, `GatesTable`, etc.), no stream.

*Why:* eliminates cache-invalidation questions; "if the report already exists then it is loaded" now means "revisiting the same runId URL loads from disk."

### D7 — list/detail UI reuse

List is a new `app/reports/page.tsx` (server component reading `fs.readdir`). Detail `app/reports/[runId]/page.tsx` reads one file and reuses the sealed branch rendering from `LiveReportClient.tsx:365-448` / `report/sample/page.tsx:56-103` as a shared `ReportView` component.

## Risks / Trade-offs

- **Vercel ephemeral FS** → runs written on hosted preview/prod disappear on redeploy/scale-to-zero. Mitigate by documenting "local durability" and keeping `runId` grammar stable so a later swap to Vercel Blob/S3 is a backend-only change (same envelope shape).
- **engineSha unavailable** (no git, no env) → file still written as `...__unknown__<ts>.json`; readers accept `unknown`. Scan never fails for this.
- **repoSha unknown** (GH-only scans) → nevers block the write; list shows `unknown` for the repo commit.
- **Path traversal via runId** → server validates `runId` against `^[\w.\-]+__[\w.\-]+__[0-9A-Za-z.\-]+$` (no `/`, no `..`) and joins only under `process.cwd()/reports`. Any mismatch 400/404.
- **Concurrent writes same ms** → ms timestamp plus process-single-thread makes collision ~impossible; if two workers somehow collide, the second write overwrites — the ts+engineSha identity already distinguishes sequential runs, so a nano suffix is not wired.
- **readdir scale** → linear read of all files; note in code as TODO if `reports/` exceeds ~2000 entries, switch to paginated `readdir` with cursor.
- **File size** (~200 KB per run) → keep-everything (per user) means `reports/` grows unbounded locally; document expected size and that users may delete files manually.

## Migration Plan

1. Add `apps/site/reports/.gitkeep` and add `reports/` to `apps/site/.gitignore`; deploy is additive.
2. Extend snapshot (`packages/engine/orchestrator.ts`) with `scanned_commit`; no breaking API change.
3. Deploy write path in `app/api/scan/route.ts`; old clients ignore the per-report `meta` attachment.
4. Add `app/reports/page.tsx` + `app/reports/[runId]/page.tsx`; existing `/live`, `/report/sample`, `/rubric` routes untouched.
5. Rollback: remove write block and new routes; existing runs remain on disk and are inert.

## Open Questions

- None that block specs/tasks. Whether to surface `repoSha` as a short 7-char chip vs full 40-char hash on the list row is a UI tweak that doesn't change the file contract.
