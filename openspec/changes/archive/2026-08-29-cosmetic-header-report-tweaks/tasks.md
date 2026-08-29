## Tasks

- [x] 1. Generate persisted sample envelope
  - Add `tooling/scripts/generate-sample-report.ts` (or inline `tsx`) that calls `SampleReportProvider.getReport({repo:"django/django"})`, builds `meta` via `buildMeta`/`buildRunId`/`normalizeTs`/`resolveEngineSha7` (`apps/site/lib/reports.ts:37-61,82-96,102-171`), sets `repoSha` from current git `rev-parse --short HEAD` or `unknown` fallback, writes envelope `{meta,report,trace:[]}` to `apps/site/reports/django__django__<sha>__<ts>.json`.
  - Run once, verify `isValidRunId` passes, `listReportMetas()` picks it up.

- [x] 2. Gitignore exception for committed sample
  - Edit `apps/site/.gitignore:41` to add `!/reports/django__django__*__*.json` (or pinned filename) so the single sample is tracked; keep `/reports/*.json` ignore for ephemeral scans.
  - `git add` the generated file, confirm `git status` shows it staged not ignored.

- [x] 3. Redirect `/report/sample` to persisted sample
  - Change `apps/site/app/report/sample/page.tsx` to `redirect(301)` to `/reports/<sampleRunId>` (constant derived from generated file name or first `listReportMetas` entry). Remove direct `ReportView` rendering.
  - Handle fallback: if no sample file found, redirect to `/reports`.

- [x] 4. Remove `engine: coming` from header
  - Delete pill span `apps/site/components/site-header.tsx:36-38`; keep nav array intact, verify layout gap unchanged.

- [x] 5. Buttons cursor pointer
  - Add `cursor-pointer` to `buttonVariants` base string `apps/site/components/ui/button.tsx:7`.
  - Add global `app/globals.css:91` rule `button,[role=button]{cursor:pointer}` for Base UI triggers (`CollapsibleTrigger`, etc.). Verify `Reveal report` and `Scan log` triggers.

- [x] 6. Live report header cleanup (all states)
  - In `apps/site/app/live/LiveReportClient.tsx`: remove `schema 1 · docs/rubric@tranche-a · ... share:` subtitle from revealed branch `:400-402`, scanning `:366`, sealed-not-revealed `:310`, refused `:273-274`; delete header actions block `:404-406` (`see method` + `view sample`). Ensure empty right rail collapses cleanly (flex gap fallback).

- [x] 7. Commit SHA subtitle on live revealed
  - In `LiveReportClient.tsx:391-402` revealed branch, render subtitle under repo title: when `report.snapshot.scanned_commit` and not `unknown`, show `commit <short7>` as `<a href="https://github.com/{report.snapshot.repo}/commit/{sha}">`; else `commit unknown` plain. Use `report.snapshot.repo` for URL. Style `text-xs text-faint` + link `underline-offset-2 hover:text-foreground`.

- [x] 8. Verify
  - `npm run compile:rubric` (if touched), `npm run check:rubric-consistency` not broken, `npm test` in `apps/site`, manual: `/live?repo=django/django` shows no pill/no method/no sample/no share but shows commit link; `/reports` lists sample; `/report/sample` 301; buttons show hand cursor.
