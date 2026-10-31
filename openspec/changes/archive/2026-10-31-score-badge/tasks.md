## 1. Contract surface

- [x] 1.1 Add `BAND_PALETTE` (band → hex, using the site token values `#22c55e` / `#e0a00a` / `#ef4444` / `#9f1d2c`) and `bandColorFor(tier)` to `packages/contracts/src/index.ts`, beside `TIER_THRESHOLDS`; verify with a unit test that every public band resolves and that no second hex table exists in the repo (`grep -r "22c55e" packages apps`).
- [x] 1.2 Add `badgeCoverage(coverage)` implementing `(measured + estimated) / (measured + estimated + unknown)` with a zero-denominator guard, and prove it equals the suppression quantity by asserting against `COVERAGE_FLOOR` on fixtures that sit either side of the floor; verify the test fails if the numerator drops `estimated`.
- [x] 1.3 Add the `BadgeViewModel` type and `badgeViewModel(envelope)` deriving `{state, label, value, claim, qualifier, accessibleName, permalink}` from `report.headline`, `report.coverage`, `report.status`, `report.snapshot.scanned_at`, and `meta`; verify a unit test covers all five states including `suppressed` + `incomplete` together.
- [x] 1.4 Add the refusal guards to `badgeViewModel` — throw on `report.sample === true` and on a run-diff delta document (reuse `isDeltaDocument`) with a reason naming which; verify the tests assert the thrown message names `sample` and `delta` respectively.

## 2. SVG renderer

- [x] 2.1 Implement `renderBadgeSvg(viewModel)` beside `apps/scanner/src/scan/render.ts` with a fixed label segment and a variable value segment, emitting `role="img"` and an `aria-label` carrying the full accessible sentence; verify a golden-file test asserts the exact SVG for a scored envelope.
- [x] 2.2 Implement the two-tier layout — tinted claim segment using `bandColorFor`, untinted qualifier segment with a dimmer foreground — and verify the test asserts the tier hex appears only once, inside the claim segment.
- [x] 2.3 Assert determinism: render the same envelope twice in one process and once after a simulated clock change (`vi.setSystemTime`), and verify all three outputs are byte-identical and contain no `Date.now()` output.
- [x] 2.4 Assert self-containment: verify the SVG contains no `href`, `xlink:href`, `<script>`, `@import`, or external `url(` reference.
- [x] 2.5 Verify the month is UTC-truncated: assert an envelope with `scanned_at: 2026-11-01T02:00:00Z` renders `2026-11` and that regenerating a 2026-03 envelope in 2027-01 still renders `2026-03`.
- [x] 2.6 Render the four non-fixture states (`scored`, `suppressed`, `incomplete`, `not-scanned`) into a throwaway HTML page and eyeball them at 1x in a browser; record the measured pixel widths in the task as the evidence for whether the label stays `leapscore` (D5) or shortens, and confirm the `incomplete` marker does not wrap the claim segment (design Open Question 1).
  - Evidence (headless Chrome, device scale 1): `scored` 253×20, `suppressed` 231×20, `incomplete` 335×20, `not-scanned` 211×20. Label stays `leapscore` in all four (D5 holds, longest state still fits). The `incomplete` marker sits in the untinted qualifier (`54% · 2026-10 · incomplete`) and does not wrap or tint the claim segment — Open Question 1 resolved as "no wrap".

## 3. Embed snippet

- [x] 3.1 Implement `renderBadgeSnippet(viewModel, {svgPath})` emitting a Markdown `[![alt](svg)](permalink)` line and an HTML `<a><img …></a>` block, with the full sentence as `alt`; verify a test asserts the permalink is the run's sealed-report URL and that `alt` contains score, band, coverage, and month.
- [x] 3.2 Verify the snippet carries no `utm_campaign` or `band` query parameter, and that the permalink resolves to `/reports/<runId>` rather than a marketing route.

## 4. CLI wiring

- [x] 4.1 Add `--badge <path>` to `apps/scanner/bin/scan.ts` usage text and flag parser, rejecting an empty value as a usage error (`exit 2`) consistent with the other path flags; verify the parser test covers both the accepted and rejected forms.
- [x] 4.2 Write the badge SVG and its snippet beside the report trio on every sealed run when `--badge` is supplied, and verify a sealed scan produces all five files with the badge's score and band matching `report.json`.
- [x] 4.3 Verify a scan of a fixture/sample report refuses to write a badge and exits with the reasoned error rather than emitting an empty file.
- [x] 4.4 Verify `--badge` produces no change to `report.json`, `report.html`, `report.md`, or `score_fingerprint` by diffing a run with and without the flag.

## 5. GitHub Action

- [x] 5.1 Add a `badge` input (default empty) and a `badge-path` output to `action/action.yml`, passing the flag through in `action/src/main.ts`; verify the action's existing test suite passes and a new test asserts the flag is forwarded only when the input is non-empty.
- [x] 5.2 Add a step to `action/README.md` showing the badge written and published so the "regenerate in CI" default is discoverable; verify the README example matches the input and output names exactly.

## 6. Documentation

- [x] 6.1 Add the badge section to `docs/plans/12_GITHUB_SURFACE_PLAN.md` — the four facts, the coverage denominator and why it is the floor quantity, the five states, and the decision that no delta occupant ships (D1) — so `00_MASTER_INDEX.md:25` is no longer pointing at an unspecified deliverable.
- [x] 6.2 Add a README embed note carrying the "regenerate in CI, never hand-edit the date" guidance; verify the note's snippet matches the emitted snippet format verbatim.

## 7. Integration verification

- [x] 7.1 Run `npm test` and `npm run lint` at the root and verify the whole suite is green.
  - Evidence: `npm test` 495 passed (scanner 335, site 60, surface 47, contracts 53) + action 24; `npm run lint` exit 0 (10 pre-existing warnings, 0 errors). The 5 pre-existing errors in untouched site files were fixed: `require()` → `node:` imports in `lib/debug-parser.ts`, `let` → `const` in `lib/parse-rubric.ts`, and `app/live/page.tsx` now keys `LiveReportClient` by repo so the reset-from-effect block (and the render-time `Date.now()` ref initializer) are gone.
- [x] 7.2 Seal one real scan, embed its badge in a scratch README, render it on GitHub's markdown preview (or an equivalent `img`-in-markdown context), and verify: the pill renders at 1x, the click resolves to the sealed report, and the alt text is announced by a screen reader or accessibility inspector.
- [x] 7.3 Verify the badge and a `--strict` local scan agree: the badge's score, band, and coverage match the `report.json` fields they were derived from, with no independent computation.
