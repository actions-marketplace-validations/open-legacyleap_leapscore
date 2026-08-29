## Context

See proposal.md Why. Current chrome: `SiteHeader` renders 5 nav links + `engine: coming` pill (`site-header.tsx:36-38`). Sample report is an ephemeral provider (`lib/sample.ts` + `lib/provider.ts:88-153`) at `/report/sample` — no file, not listed on `/reports`. Live client `LiveReportClient.tsx` has 5 render branches (error/refused/sealed-not-revealed/scanning/revealed) each with its own header block; revealed shares a subtitle and two right-side links that are now noise. Commit SHA is already resolved in `app/api/scan/route.ts:144-150` but never shown on live revealed.

## Goals / Non-Goals

**Goals:**
- Single committed sample envelope that behaves like any persisted run.
- Live header cleaned uniformly across branches; revealed subtitle is commit link.
- Button affordance consistent without per-component churn.

**Non-Goals:**
- Changing scoring, rubric, detector, or persistence grammar.
- Restyling theme/tokens.
- Adding caching or dedup for `/api/scan`.

## Decisions

**Sample persistence: checked-in envelope + redirect over alias.**
- Generate envelope via `SampleReportProvider` + `buildMeta`/`buildRunId` with `engineSha7 = resolveEngineSha7()` at generation time (current git short SHA) and `runId = <slug>__<sha>__<ts>` where `ts = normalizeTs(snapshot.scanned_at)`. Store at `apps/site/reports/django__django__<sha>__<ts>.json`. Alternatives: keep `/report/sample` as separate route (fragmented discoverability) or generate on build (non-deterministic, not git-versioned). Chosen because list page already enumerates `meta` without opening `report`.

**Gitignore: exception vs un-ignore.**
- Keep `/reports/*.json` ignore, add `!/reports/django__django__*__*.json` exception for the single sample pattern (or pin exact filename). Alternative fully un-ignore `reports/` — would commit every local scan.

**Live header cleanup: strip all branches vs only revealed.**
- Decision: strip `schema · rubric · share` subtitle and `see method / view sample` links from *all* live branches (error keeps only repo title + error, refused keeps repo + reason). Keeps revealed branch as canonical with commit link. Alternative per-branch cleanup — leaves inconsistency.

**Commit SHA: subtitle under repo title.**
- Render `<a href="https://github.com/{repo}/commit/{sha}">{short7}</a>` as subtitle (`text-xs text-faint` + link) beneath `report.snapshot.repo` in `LiveReportClient.tsx:391-407` revealed branch. Unknown → `unknown` plain text. Alternative footer-only — less discoverable.

**Cursor: global + variant.**
- Add `cursor-pointer` to `buttonVariants` base and `app/globals.css` `button,[role=button]{cursor:pointer}` to cover Base UI `CollapsibleTrigger`. Alternative per-instance class — fragile.

## Risks / Trade-offs

- Sample `runId` tied to generation-time SHA → if regenerated on different commit, filename changes; old file becomes orphan unless removed. Mitigate: document single committed filename, regeneration script overwrites same pattern via `git rev-parse --short HEAD`.
- Redirect `/report/sample` → `/reports/<runId>` is hard-coded to one id; if sample file renamed, redirect breaks. Mitigate: redirect reads `listReportMetas` fallback or constants file.
- Stripping share URL from live scanning states removes copy-paste affordance before seal; users must wait for sealed `meta` or detail page. Mitigate: detail page retains share via `ReportView` persisted subtitle.

## Migration Plan

1. Generate sample envelope, commit JSON, update `.gitignore` exception.
2. Ship header/button/live changes together (no flag).
3. Deploy; verify `/report/sample` 301, `/reports` shows sample row, live revealed shows commit link, header pill gone, buttons show pointer.
4. Rollback: revert commit — no data migration.

## Open Questions

- Should `/report/live` alias (`app/report/live/page.tsx`) also lose share line or keep for backward link sharing? Safe to strip per decision above.
