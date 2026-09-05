# LeapScore site

Marketing + product site for leapscore.dev. Built with Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-nova preset over Base UI).

## Routes

- `/` — marketing hero. Intro + URL box, then the report teaser (dial, exactly 58.00), the differentiator proof strip, a who-it's-for band, a credibility band (Rubric / Method / Product), and the waitlist CTA. The sample headline comes through the same provider the report page uses.
- `/product` — the product story: deliverable triad, the 10 categories (from `lib/categories.ts`), who it's for, the trust model (`measured`/`estimated`/`unknown` + gates), what it is not, the honest roadmap, and the CTA band.
- `/report/sample` — sample audit for `django/django` (or `?repo=owner/name`). Full report anatomy: dial, coverage strip, gates G1–G8, category scorecards with per-row evidence, the 102-indicator table, top blockers, deep-dive scope. Stamped illustrative; numbers are seeded, not scanned.
- `/live` (+ `/report/live`) — live scan UI. Paste any public GitHub URL → streams `GET /api/scan?repo=owner/repo` (NDJSON `meta → progress → report`) backed by the real engine (`runUnifiedScan`, 31 indicators, unified indicator-count-driven budget). Single-flight coalescing dedupes concurrent scans for the same repo.
- `/reports` + `/reports/[runId]` — persisted runs. Each completed scan writes one JSON envelope (report + meta + trace) via `lib/reports.ts`; history page lists them, detail page renders them. Sample run ships as seed data.
- `/rubric` (+ `/rubric/[categoryId]`) — compiled-registry browser over `lib/generated/rubric.ts` (102 indicators, remediation playbooks, effort tags).
- `/method` — scoring model, weights, tiers, and the honest "what's live vs sample" statement.
- `/api/scan` — unified scan endpoint (Node runtime, force-dynamic). Streams NDJSON; persists the envelope on completion.
- `/api/reports/[runId]` — serves a persisted run envelope.

## Architecture

- `lib/types.ts` — the report contract, mirroring `docs/plans/06_DATA_MODEL_API.md`.
- `lib/categories.ts` — the 10-category metadata (name, one-liner, weight), single-sourced; imported by both `/product` and `/method`. Weights come from `lib/scoring.ts` `BASE_WEIGHTS`.
- `lib/scoring.ts` — exact rational scoring (BigInt lcm denominators); mirrors `docs/rubric/11 §1–§3`.
- `lib/sample.ts` — authored seed for `django/django`: 76 standard rows + 18 deep-dive + 8 FE-annex.
- `lib/provider.ts` — the `ReportProvider` seam for the **sample** report. UI only talks to this interface.
- `lib/provider.live.ts` — `LiveReportProvider`: maps engine `FactRecord`s → report rows (registry-normalized names, remediation, effort), builds the full 102-row table (live rows + `unknown` placeholders for unmeasured indicators).
- `lib/reports.ts` — persisted-run store: `runId` grammar (`owner__repo__sha__timestamp`), write/read/list envelopes under `reports/`.
- `lib/generated/rubric.ts` — compiled registry (do not hand-edit; `npm run compile:rubric` from root regenerates it from `docs/rubric/`).
- `app/actions.ts` — waitlist server action (Buttondown, env-keyed, honest not-wired fallback).

## Commands

- `npm run dev` — dev server.
- `npm run build` — build (must stay green; it is the CI gate).
- `npm run lint` — eslint.
- `npm test` — vitest. `lib/score.consistency.test.ts` recomputes the system score from the seed and asserts the 58.00 headline; edit the seed and this fails. `lib/registry.test.ts` asserts the compiled registry matches the engine; `lib/reports.test.ts` covers the run store.
- `npm run format` — prettier (JS/TS; Tailwind plugin).

## Rules (hard)

- Sample surfaces are stamped illustrative; live surfaces (`/live`, `/reports/*`) show scanned data with provenance (engine/rubric/tool versions, commit SHA, elapsed time).
- Branding: LeapScore, leapscore.dev, dial/gauge mark.
- Color is reserved for tier bands (≥80 green, 53–79 amber, 27–52 red, <27 deep red). Everything else is neutral.
- Never hand-edit a derived number: category %, weighted contribution, headline — all recomputed via `lib/scoring.ts`. Never hand-edit `lib/generated/rubric.ts`.

## Note on derived percentages

The locked plan text describes coverage as "65/25/10", but exact rounding of 49/19/8 over 76 rows yields 64/25/11. The counts (49/19/8) are canonical and asserted in `lib/score.consistency.test.ts`; the displayed percentages come from `scoring.ts` rounding. See `docs/plans/00` open questions.
