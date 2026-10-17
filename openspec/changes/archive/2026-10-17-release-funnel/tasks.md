## 1. Contracts + CLI funnel surfaces

- [x] 1.1 Add `POSITIONING_LINE` to `packages/contracts/src/index.ts` with the exact text `LeapScore sees the structure. The assessment understands what the code does.`, exported alongside `BAND_CTA`/`assessmentUrlForBand`, and verify a contracts test asserts the literal text and that `npm run test -w packages/contracts` passes
- [x] 1.2 Recompose the CLI stdout line in `apps/scanner/src/scan/scoring/seal.ts` + `apps/scanner/bin/scan.ts` so the single line reads `<score>/<tier> gates:… coverage:… [threshold:…] — <assessmentCtaForBand(tier)> <assessmentUrlForBand(tier)>` with the tracked URL as the final token appearing exactly once, and verify updated `cli-offline-scan.test.ts` passes: one line, status prefix order unchanged, sentence once, URL once, and a `--fail-under` run keeps threshold state inside the prefix
- [x] 1.3 Update `apps/scanner/src/scan/render.ts` HTML + Markdown emitters to end with methodology link → band CTA → `POSITIONING_LINE` (imported, not hardcoded) and to contain the tracked URL exactly once (remove the duplicate footer/bottom link), and verify by scanning the test fixture and asserting in `report.html` + `report.md`: positioning line is the final content, URL count is 1, methodology link present, no external assets

## 2. Site funnel surfaces

- [x] 2.1 Add `apps/site/app/methodology/page.tsx` that `permanentRedirect`s to `/method` (same pattern as `app/report/sample/page.tsx`), and verify `npm run build -w apps/site` lists the `/methodology` route and a dev-server request returns a permanent redirect to `/method`
- [x] 2.2 Migrate site band labels to the public set: `apps/site/lib/scoring.ts` `TIERS` labels → `Low`/`Moderate`/`High`/`Critical`, `app/reports/page.tsx` and `components/gates-table.tsx` copy/maps updated (legacy alias keys kept valid for stored envelopes), and verify site tests pass with a new assertion that no rendered surface prints `Healthy`/`High Risk` as a band label
- [x] 2.3 Add `apps/site/components/report-next-step.tsx` (band sentence → tracked link → positioning line, all from contracts) and render it at the end of `components/report-view.tsx`, and verify a component/report test asserts the order and that the link equals `assessmentUrlForBand(tier)` for the fixture tier
- [x] 2.4 Update the `/method` page tier/threshold copy and `apps/site/lib/provider.ts` sample tier label to the public vocabulary, and verify `next build` + the site test suite stay green with the method page rendering `Low/Moderate/High/Critical`

## 3. Canonical rubric rename

- [x] 3.1 Rename band labels in `docs/rubric/11_WEIGHTS_THRESHOLDS_CONFIG.md` §3 (canonical) to `Low (≥80) / Moderate (53–79) / High (27–52) / Critical (<27)` with one "formerly Healthy / High Risk" mapping note, and verify thresholds and compiled keys are unchanged: `npm run compile:rubric && npm run check:rubric-consistency` passes
- [x] 3.2 Propagate the rename to derived views — `docs/rubric/README.md` band table, `docs/rubric/00_EXECUTIVE_RUBRIC.md` band table + gate-cap wording, `docs/rubric/templates/*` score sheets — leaving the 0–3 row taxonomy (`3 — Healthy`) untouched, and verify a grep sweep finds no stale band labels in `docs/rubric/` outside the mapping note
- [x] 3.3 Append the vocabulary decision to `docs/plans/00_MASTER_INDEX.md` with `# · Decision · Rationale · Status` (supersedes W5's legacy band naming; thresholds unchanged), and verify the line is present and `npm run check:rubric-consistency` still passes

## 4. Funnel-landing chrome

- [x] 4.1 Fix the broken rubric links on the homepage and footer (`../rubric/README.md` → `/rubric`) and update the footer disclaimer so it reflects shipped local CLI + live scan with sample reports illustrative, and verify `grep -r "\.\./rubric" apps/site` returns nothing and the site test suite passes
- [x] 4.2 Update `/method` "Where we are now" copy to name the local CLI and live scan as available (no "in development behind the waitlist" language), and verify the page renders the shipped-paths copy in a test or manual dev-server check

## 5. Verification and handoff

- [x] 5.1 Run the full gate: `npm run check:rubric-consistency`, `npm run check:detector-isolation`, contracts + scanner + site test suites, and a repo-wide grep sweep for a second copy of the positioning sentence and for stray band labels on rendered surfaces — all must pass
- [x] 5.2 Dogfood end-to-end: scan a real repo (this monorepo) and inspect stdout (one line, sentence + URL last, URL once), `report.html`, `report.md` (positioning line final, URL once), and a site report view (band renders) — record the observed output in the change's verification notes
- [x] 5.3 Confirm the deferred scope stayed deferred and record the release blockers: no `/assessment` route or analytics added, and note in the change notes that the follow-up `assessment-funnel` change plus the `leapscore.dev` domain bring-up must land before public release — verify by listing `apps/site/app` routes and re-reading the proposal's non-goals
