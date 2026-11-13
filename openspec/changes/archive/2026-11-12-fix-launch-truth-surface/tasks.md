## 1. Contract next-step foundation

- [x] 1.1 Add a single verdict-aware `assessmentNextStep` helper to `packages/contracts/src/index.ts` that returns the sentence and URL for either a scored band or the `insufficient-signal` verdict; verify it compiles and the contracts test suite passes.
- [x] 1.2 Encode the URL grammar in the helper: scored runs carry `utm_campaign=cli-scan-v1&band=<tier>`; suppressed runs carry `utm_campaign=cli-scan-v1&verdict=insufficient-signal` and no `band`; verify with contract tests for all four bands plus suppressed.
- [x] 1.3 Remove the silent Moderate fallback for unknown tiers and make an unknown or missing band fail loudly in development; verify a contract test asserts the failure.
- [x] 1.4 Migrate every in-repo caller off the old `assessmentCtaForBand` / `assessmentUrlForBand` pair; verify a repository search finds no production callers outside the contract module.
- [x] 1.5 Update `packages/contracts/src/index.test.ts` so it no longer blesses the Low-band peer-benchmark claim and covers the suppressed URL; verify the contracts suite passes.

## 2. Scanner suppression

- [x] 2.1 Update `formatStdout` in `apps/scanner/src/scan/scoring/seal.ts` to use the verdict-aware helper; a suppressed run prints the coverage-limit sentence and the no-band URL, and a scored run keeps the band sentence; verify with a scanner stdout test.
- [x] 2.2 Update `renderHtml` in `apps/scanner/src/scan/render.ts` so a suppressed report opens with `insufficient signal` and no band, and closes with the suppressed sentence and no-band URL; verify with an emitter test.
- [x] 2.3 Update `renderMarkdown` in the same module with the same suppressed behavior; verify with an emitter test.
- [x] 2.4 Add a scanner suppression matrix test covering stdout, HTML, and Markdown for both a scored run and a suppressed run; verify it asserts `band=` appears only for the scored run and `verdict=insufficient-signal` appears only for the suppressed run.

## 3. Local subject portability

- [x] 3.1 Change the local snapshot builder in `apps/scanner/src/scan/local.ts` to seal `snapshot.repo` as the directory basename and remove `snapshot.local_path`; verify the local scan tests still pass.
- [x] 3.2 Change the local identity subject to the directory basename and update `bin/scan.ts` so `meta.repo` is the basename and `meta.repoUrl` is name-only; verify the identity tests pass.
- [x] 3.3 Add a path-free artifact test that scans a uniquely named temp directory and asserts the absolute path appears in none of `report.json`, `report.html`, or `report.md`; verify it fails before the fix and passes after.
- [x] 3.4 Add a regression test that the basename change leaves `runId` and `score_fingerprint` unchanged for the same target; verify it passes.

## 4. Site report surfaces

- [x] 4.1 Change `ReportNextStep` to accept the sealed headline state rather than a tier plus score, and render the suppressed verdict/no-band link when suppressed; verify the component tests.
- [x] 4.2 Change `ReportView` to branch on `headline.suppressed` before computing a display tier: no dial, score, tier, or `ci_band` as a verdict; show coverage and the measure path instead; verify with a suppressed fixture test.
- [x] 4.3 Add a site suppression matrix test covering the site report next step and hero for both scored and suppressed reports; verify it asserts no band CTA or `band=` for the suppressed case.
- [x] 4.4 Add a site test that a local sample or fixture with a nested subject renders the basename and no absolute path; verify it passes.

## 5. Assessment destination

- [x] 5.1 Keep `ASSESSMENT_BASE_URL` at the placeholder `https://leapscore.dev/assessment` and add `apps/site/app/assessment/page.tsx` with the assessment description, local-scan/no-upload statement, report-sharing and storage statement, MCM separate-consent statement, and a booking form or link; verify the route builds and a contract test asserts the placeholder is the single base URL.
- [x] 5.2 Wire a working fallback booking path (mailto with campaign attribution) for the period before a booking vendor is configured; verify a click from a report CTA reaches the fallback with the campaign parameters.
- [x] 5.3 Add a release check or test that the configured assessment destination resolves or that the `/assessment` route exists; verify the check fails when the route/URL is removed.

## 6. Marketing surface truth

- [x] 6.1 Rewrite the home page around the GTM A2 structure: the local install command as primary CTA, the sample report as secondary, coverage and privacy above the fold, and `/live` as a secondary public-repo demo; verify the page contains no waitlist, "coming", "Deep Scan", "points gained per hour", "102 inputs", or "scores each one".
- [x] 6.2 Replace `/product` with a permanent redirect to `/method` and remove the waitlist component/action from the served surface; verify the redirect resolves and the old pre-launch claims are no longer published.
- [x] 6.3 Correct the method page's denominator, add the coverage floor and suppression rule, replace score-points-per-hour wording with verify-effort wording, and distinguish JSON evidence pointers from HTML/Markdown summaries; verify with the copy test.
- [x] 6.4 Relabel the reports index and detail page as a site-owned illustrative sample, remove "Past scans appear here after you run one" and "keep everything locally", and label the sample row and title; verify the page renders the sample label before any score.
- [x] 6.5 Add a banned-phrase test across `/`, `/product`, `/method`, `/reports`, and the sample report for the GTM prohibited claims; verify the test catches the current copy before the fixes and passes after.

## 7. Sample report

- [x] 7.1 Decide whether the sample can be regenerated from a real v1.0.2 local scan of the synthetic Maven fixture before the launch deadline; record the decision in the change notes.
- [x] 7.2 If regenerating, fix the subject-name behavior first, then produce the sealed envelope, update the pinned sample `runId`, and wire the new envelope into `provider.ts` and `reports.ts`; verify the sample's engine/rubric versions and coverage are real.
- [x] 7.3 (N/A — regeneration path taken; see 7.1) If regeneration is not feasible, hide the interactive sample and use the committed real screenshot with an explicit "authored layout demo" label and a real coverage statement beside it; verify the page no longer presents 49 measured rows as current coverage.
- [x] 7.4 Label the sample on the reports index, the detail page title, and the report body; verify `report.sample` is true and the label precedes the first score on each surface.
- [x] 7.5 Update the tests that pin the old 58/Moderate sample and the authored identity to the regenerated or relabelled fixture; verify the site suite passes.

## 8. Badge

- [x] 8.1 Add an explicit capability to the badge snippet renderer so the snippet links to the sealed report only when the deployment hosts reports; default the CLI to an unlinked snippet; verify both Markdown and HTML outputs.
- [x] 8.2 Update the badge tests and the `score-badge` spec parity so a deployment without report hosting never emits an unresolvable per-run link; verify the badge suite passes.
- [x] 8.3 Add a release-note line that existing linked snippets are not regenerated and that the badge remains a local static artifact; verify the documentation structure check passes.

## 9. README and security disclosure

- [x] 9.1 Add the coverage line and the "not a benchmark" line to the README first screen, pairing the detector count with the release version and date; verify a docs test or manual first-screen check.
- [x] 9.2 Add `SECURITY.md` with supported versions, a private reporting channel, response expectations, scope, and no public-issue request; verify the file exists and the documentation structure check passes.
- [x] 9.3 Update `apps/site/README.md` route descriptions for the redirected product page, sample-only reports index, and new assessment route; verify the docs structure check passes.

## 10. Verification and release gates

- [x] 10.1 Run `npm run release:gates` and verify every check, bundle parity, and workspace suite passes.
- [x] 10.2 Run `openspec validate "fix-launch-truth-surface" --strict` and verify the change validates.
- [x] 10.3 Perform a manual claim audit against the GTM section 5 claim register across the rendered home, product redirect, method, reports, sample, README, and report surfaces; verify no prohibited claim survives.
- [x] 10.4 Verify a real `/assessment` click from a local scan reaches a working booking path or the mailto fallback, and that the data-handling copy is visible before any submission.
