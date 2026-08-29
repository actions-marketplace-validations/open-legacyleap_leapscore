## Why

The site has outgrown placeholder chrome and an isolated sample page. Header shows "engine: coming", buttons lack affordance, and the illustrative django/django report lives only as an in-memory mock at `/report/sample` — invisible in run history and not versioned. Live pages also carry noisy provenance (schema/share/method links) that distracts from the sealed report.

## What Changes

- Remove `engine: coming` pill from `SiteHeader` (`apps/site/components/site-header.tsx:36-38`). Keep home-page badge untouched.
- Persist the illustrative sample report as a real envelope `apps/site/reports/<runId>.json` checked into git (current git short SHA for `engineSha7`) and surface it on `GET /reports` list; make `/report/sample` 301 redirect to that persisted run.
- Add `cursor: pointer` to all buttons (variant base in `ui/button.tsx:7` + global `button,[role=button]` in `globals.css`) so `Reveal report`, `View/JSON/Rerun`, and `Scan log` triggers show hand cursor.
- Live report (`/live`, `/report/live` via `LiveReportClient.tsx`): remove `view sample` and `see method` links from header actions, remove `schema 1 · docs/rubric@... · share: /live?repo=...` subtitle from all live states (revealed, sealed-not-revealed, scanning, refused), and render target repo commit SHA (short 7 + link to `https://github.com/{repo}/commit/{sha}`) as subtitle under `django/django` title on the revealed sealed state. Handle `unknown` gracefully.

## Capabilities

### New Capabilities
- `site-shell`: header affordance and button cursor behavior (new presentation capability for global chrome).

### Modified Capabilities
- `reports/persisted-runs`: allow a single checked-in sample envelope (gitignore exception) with deterministic `runId` using current git SHA.
- `reports/run-history-ui`: sample appears as a first-class row in the run-history table; empty-state no longer sole path to first run.
- `report-rendering`: live sealed presentation — subtitle is now commit link, provenance/share/method affordances removed.

## Impact

- Code: `apps/site/components/site-header.tsx`, `app/report/sample/page.tsx` (redirect), `app/reports/page.tsx`, `lib/reports.ts`, `app/live/LiveReportClient.tsx`, `components/ui/button.tsx`, `app/globals.css`, `app/api/scan/route.ts` (commit link helper already present), `.gitignore`.
- Data: one ~65KB JSON committed to `apps/site/reports/` (deterministic sample). No migration; existing 3 local reports remain valid.
- UX: header loses one pill; live header loses two right-side links and a subtitle line; gains commit SHA link. Buttons gain pointer cursor. Sample discoverable via `/reports` like any scan.
