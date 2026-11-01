# LeapScore site

Marketing + product site for leapscore.dev. Built with Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-nova preset over Base UI).

**The site never executes a scan.** It is the presentation side: it streams the standalone scanner service's NDJSON cross-origin and renders sealed envelopes. `tooling/checks/site-boundary.ts` fails the build if the served graph reaches `apps/scanner` or uses `node:fs`/`child_process` outside build tooling.

## Routes

- `/` — marketing hero. Intro + URL box, then the report teaser (dial, exactly 58.00), the differentiator proof strip, a who-it's-for band, a credibility band (Rubric / Method / Product), and the waitlist CTA. The sample headline comes through the same provider the report page uses.
- `/product` — the product story: deliverable triad, the 10 categories (from `lib/categories.ts`), who it's for, the trust model (`measured`/`estimated`/`unknown` + gates), what it is not, the honest roadmap, and the CTA band.
- `/report/sample` — permanent redirect to the pinned sample run in history (`/reports/[runId]`).
- `/live` (+ `/report/live`) — live scan UI. Paste any public GitHub URL → the client streams `GET <scanner>/scan?repo=owner/repo` (NDJSON `meta → progress → trace → report | refused`) straight from the scanner service. The scan URL comes from `NEXT_PUBLIC_SCANNER_URL` (`lib/scanner.ts`); there is no same-origin proxy and no site-side scan code. Single-flight coalescing happens in the scanner, not here.
- `/reports` + `/reports/[runId]` — run history. `lib/reports.ts` is a **read-only, site-owned** ingest over committed static envelopes (`lib/fixtures/*.json`): it validates the contract version, skips delta documents and non-envelopes with a recorded reason, and exposes metas for the list page. Detail pages prerender from that history (`dynamicParams = false`); an unknown-but-valid `runId` 404s. No filesystem reads at request time, no scanner contact. Sample run ships as seed data, stamped `sample: true`.
- `/reports/[runId]/raw` — the same envelope as raw JSON (the scanner serves no permalinks, so a shareable citation is a site concern).
- `/rubric` (+ `/rubric/[categoryId]`) — compiled-registry browser over `lib/generated/rubric.ts` (102 indicators, remediation playbooks, effort tags).
- `/method` — scoring model, weights, tiers, the kill-switch gate cap, and the honest "what's live vs sample" statement.
- `/methodology` — permanent redirect to `/method`, so the methodology URL the CLI writes into every `report.html`/`report.md` is a real route (`release-funnel`; lockstep asserted by `lib/methodology-link.test.ts`).

There is **no `/api/scan` and no `/api/reports/[runId]`** — those site-side scan routes are gone; the scanner service owns scanning and the site owns presentation.

## Architecture

- `lib/types.ts` — the report contract, re-exported from `@leapscore/contracts` (producer-owned; the site declares no second authoritative `Report`).
- `lib/scanner.ts` — scanner-service URL + typed refusal copy for the NDJSON `refused` reasons.
- `lib/categories.ts` — the 10-category metadata (name, one-liner, weight), single-sourced; imported by both `/product` and `/method`. Weights come from `lib/scoring.ts` `BASE_WEIGHTS`.
- `lib/scoring.ts` — exact rational scoring (BigInt lcm denominators); mirrors `docs/rubric/11 §1–§3`. Band vocabulary `Low/Moderate/High/Critical` with the one-release legacy aliases (`Healthy`/`High Risk`) mapped.
- `lib/sample.ts` — authored seed for `django/django`: 76 standard rows + 18 deep-dive + 8 FE-annex.
- `lib/provider.ts` — the `ReportProvider` seam for the **sample** report only. UI talks to this interface; live reports arrive over HTTP in `app/live/LiveReportClient.tsx`, never through this in-process seam.
- `lib/reports.ts` — site-owned run history: `runId` grammar (`owner__repo__engineSha7__timestamp`, shared with the contract), document classification/ingest, read/list. Read-only: the site writes no reports.
- `lib/generated/rubric.ts` — compiled registry (do not hand-edit; `npm run compile:rubric` from root regenerates it from `docs/rubric/`).
- `app/actions.ts` — waitlist server action (Buttondown, env-keyed, honest not-wired fallback).

## Commands

- `npm run dev` — dev server.
- `npm run build` — build (must stay green; it is the CI gate).
- `npm run lint` — eslint.
- `npm test` — vitest. `lib/score.consistency.test.ts` recomputes the system score from the seed and asserts the 58.00 headline; edit the seed and this fails. `lib/registry.test.ts` asserts the compiled registry matches the engine; `lib/reports.test.ts` covers the history reader; `components/gate-cap.test.tsx` and `lib/methodology-link.test.ts` hold the report surfaces and the CLI link in lockstep with the contract.
- `npm run format` — prettier (JS/TS; Tailwind plugin).

## Rules (hard)

- Sample surfaces are stamped illustrative; live and persisted surfaces show scanned data with provenance (engine/rubric/tool versions, commit SHA, elapsed time).
- Branding: LeapScore, leapscore.dev, dial/gauge mark.
- Color is reserved for band tiers (≥80 green, 53–79 amber, 27–52 red, <27 deep red). Everything else is neutral.
- Never hand-edit a derived number: category %, weighted contribution, headline — all recomputed via `lib/scoring.ts`. Never hand-edit `lib/generated/rubric.ts`.
- Never restate shared wording or thresholds in a component: band vocabulary, band colors, the next-band-path block, the gate-cap sentence, the positioning line and the assessment CTA all come from `@leapscore/contracts`, so the site and the CLI reports cannot drift.

## Note on derived percentages

The locked plan text describes coverage as "65/25/10", but exact rounding of 49/19/8 over 76 rows yields 64/25/11. The counts (49/19/8) are canonical and asserted in `lib/score.consistency.test.ts`; the displayed percentages come from `scoring.ts` rounding. The historical rounding question is recorded in the retired planning corpus; the counts above are the current contract.
