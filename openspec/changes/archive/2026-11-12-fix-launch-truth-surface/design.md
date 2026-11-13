## Context

See `proposal.md` - Why. The current implementation has four constraints that shape the approach:

- The report contract is producer-owned in `packages/contracts`; the CLI emitters, CLI stdout, and the site's report surfaces all consume the same assessment helpers. A surface-local fix would leave the other surfaces lying.
- The scanner is stateless. The site owns a single committed sample envelope and prerenders report pages with `dynamicParams = false`; a per-run badge permalink has no store behind it.
- The local lane seals the absolute scan path as the subject (`snapshot.repo`, `snapshot.local_path`, `meta.repo`, `meta.repoUrl`, `identity.subject.repo`), while `runId` already derives from the basename.
- Suppression is already sealed correctly (`headline.suppressed`, `headline.verdict`, no next-band path), and the badge already renders `unscored`. The gap is presentation: the site hero and all CLI next-step surfaces still consume `headline.tier` as if a band existed.

## Goals / Non-Goals

**Goals:**

- Make every public claim, report CTA, sample, and local artifact match what v1.0.2 actually ships.
- Make suppression a first-class presentation state on the site and in every CLI output.
- Make the assessment next step a real destination with a working booking path and data-handling copy.
- Make local reports portable by sealing a subject name, not a filesystem path.
- Encode the truth as tests so the next release cannot drift.

**Non-Goals:**

- Hosted report storage or a report permalink service.
- A public peer benchmark or public-repo index.
- New detectors, scoring math, or rubric changes.
- A full marketing-site redesign beyond the truth fixes.
- Selecting or integrating a specific booking vendor beyond the route and a working fallback.

## Decisions

### D1. One verdict-aware next-step helper

Replace the two independent helpers (`assessmentCtaForBand`, `assessmentUrlForBand`) with one `assessmentNextStep` that takes the sealed headline state and returns both the sentence and the URL. It SHALL accept the scored band or the suppressed verdict, never both. For a scored run the URL carries `utm_campaign=cli-scan-v1&band=<tier>`; for a suppressed run it carries `utm_campaign=cli-scan-v1&verdict=insufficient-signal` and no `band`. An unknown tier SHALL NOT silently fall back to Moderate.

**Why:** the current split lets a caller combine a suppressed verdict with a normal band URL, which is exactly the P0 3 bug. The fallback to Moderate makes the failure silent. One helper makes the illegal pairing unrepresentable.

**Alternatives considered:** keep two helpers and add a `suppressed` boolean to each (still easy to call the wrong one); keep per-surface copy (the drift the change exists to stop).

**Compatibility:** migrate every in-repo caller. Retain the old exports as deprecated wrappers only if an external consumer is found; otherwise remove them. The contract version does not need a bump for the helper change because the envelope shape is unchanged.

### D2. Suppression is a presentation state, not a reference score

The site report view SHALL branch on `headline.suppressed` before it computes a display tier. When suppressed:

- No dial, score, tier, or `ci_band` is presented as a verdict.
- The hero states `insufficient signal`, shows coverage, and points to the rows and measure paths that would make the estate measurable.
- The identity card remains first and in full (`report-identity` already requires this).
- The next step is the `insufficient-signal` sentence and the no-band link.
- The reference score and tier remain in `report.json` only, for diagnosis.

The CLI stdout and emitters already suppress the headline; extend the same state to the CTA and remove any band-derived wording.

**Why:** the product's promise is that it would rather suppress a headline than invent one. A suppressed scan that renders a band on the site or sells a band CTA in the CLI breaks that promise even when the JSON is honest.

**Alternative considered:** keep the reference score beside the verdict with a "suppressed" label. Rejected: readers compare the number to a band, and the next-step link still needs a band it does not have.

### D3. Regenerate the sample; relabel only as a fallback

The preferred path is to run the shipped CLI on the checked-in synthetic Maven fixture, commit the sealed envelope as the site's sample, and have both the reports index and the home-page teaser read that envelope. The sample then carries real engine/rubric versions, real coverage, and the same subject-name rule as any local scan. Update the pinned sample `runId`, the authored sample seed, and the tests that assert 58/Moderate.

If regeneration cannot land before the launch deadline, hide the interactive sample and use the committed real screenshot with a clear "authored layout demo" label. Do not present the authored 49-measured-row coverage as the product's current coverage.

**Why:** the sample is the proof asset. The repo already has a real scan screenshot in `docs/sample-report/`; the interactive sample is the outlier, and it currently overstates coverage by roughly a factor of two while saying the live engine is coming.

**Alternative considered:** keep the authored sample and label its coverage "illustrative." Rejected as the primary path: a proof asset whose coverage is fake is weaker than no interactive sample.

**Decision (implementation, 12 Nov 2026):** regeneration is feasible, so the primary path was taken. A v1.0.2 local scan of `apps/scanner/src/scan/__tests__/fixtures/legacy-stacks/maven-multi-module` seals a scored headline (5.71, Critical) over 13 measured + 1 estimated of 28 attempted rows — 50%, so it clears the coverage floor and is not suppressed. The sealed envelope is committed as the site's only sample, carrying the release's real engine and rubric versions and the name-only local subject rule. The authored seed in `apps/site/lib/sample.ts` is retired; the fixture is marked `sample: true` because its target is a checked-in synthetic demo, not a customer repository. The committed real screenshot in `docs/sample-report/` remains the layout reference.

### D4. Local subject portability at the producer

Change the local lane at the point where it seals the subject:

- `snapshot.repo` becomes the scanned directory's basename.
- `snapshot.local_path` is removed.
- `meta.repo` becomes the basename; `meta.repoUrl` becomes a name-only `file://` URI (or is omitted if the contract makes it optional).
- `identity.subject.repo` becomes the basename.

Do not redact at the renderer. The JSON is the artifact that travels; a renderer-only fix leaves the path in `report.json` and in any downstream consumer.

**Why:** the report is meant to go to a budget holder. The absolute path is both a disclosure and a portability problem, and it is currently sealed in five places. `runId` already uses `localSlugFromPath(basename(...))`, and the fingerprint excludes repo/path, so this change does not move the run identity or the score.

**Alternative considered:** keep the full path in JSON and redact only HTML/Markdown. Rejected: `report.json` is a published artifact and is often attached to tickets.

**Compatibility:** existing envelopes with absolute paths remain readable; the change applies to newly sealed reports. No contract version bump is required if `repoUrl` remains a string. Search for consumers that expect `local_path`; the repo has none outside the local snapshot test.

### D5. A small site-owned assessment page

Add a site route at the path the contract already advertises (`/assessment`) that states what the $0 Assessment is, that the scan runs locally and no code upload is required, what part of a report is requested, how it is stored, and that MCM or deeper work needs separate consent. Provide a booking form or a configured booking link. If the vendor is not ready, use a `mailto:` fallback with the campaign parameters so the CTA is never dead.

Keep `ASSESSMENT_BASE_URL` as the single source and keep it at the existing placeholder, `https://leapscore.dev/assessment`. The placeholder is the stable site route, not a vendor URL; the booking vendor link is configuration inside the page. Do not hardcode a vendor URL into the contract until the vendor is selected. Add a release check that fails when the configured destination does not resolve or the route is missing.

**Why:** every report CTA points here; a 404 kills the only commercial path. A site-owned page also lets the product control the data-handling statement and the attribution.

**Alternatives considered:** point the contract directly at an external booking URL (less control, still needs the data-handling copy); mailto-only (a stopgap, not a booking experience).

### D6. Shrink the marketing surface before rewriting it

- `/product` becomes a permanent redirect to `/method` for launch. The method and rubric pages already carry the real story; the product page carries the most pre-launch claims and duplicates the method. If marketing needs a product page later, add a short "what it is / what it isn't" page with approved copy.
- `/` is rewritten around the GTM's A2 structure: H1 "How much legacy risk is your codebase carrying?", the local install command as the primary CTA, the sample report as the secondary CTA, coverage and privacy above the fold, and `/live` as a secondary public-repo demo.
- `/reports` keeps its route but is relabelled as a site-owned sample. Remove "Past scans appear here after you run one" and "keep everything locally"; label the sample row and the detail title.
- `/method` keeps its structure but corrects the denominator, adds the coverage floor and suppression rule, replaces score-points per hour with verify-effort language, and distinguishes JSON evidence from human-readable summaries.

**Why:** the smallest truthful surface is faster and more credible than repairing every pre-launch page. The redirect also reduces the number of places that can drift.

**Alternative considered:** rewrite `/product` in place. Rejected for launch: more copy, more claims, and no unique information beyond `/method` and `/rubric`.

### D7. Badge snippet: honest by default

Add an explicit capability to the snippet renderer: link to the sealed report only when the emitting deployment hosts sealed reports. The default for the CLI is unlinked; the SVG and alt text are unchanged. Keep `reportPermalinkFor` for a future hosted-report deployment.

**Why:** the scanner is stateless and the site only prerenders one fixture, so a per-run permalink is a broken promise for every real scan. The badge is still useful as a self-contained static artifact.

**Alternatives considered:** host reports (out of scope, large); link to `/reports` (still implies a history that does not exist); remove the badge (loses a useful CI artifact).

**Breaking change:** existing snippets that wrap the badge in a per-run link will not be regenerated. Call this out in the release notes. The badge SVG itself is unchanged.

### D8. Tests are the guardrail

Add four test families:

- **Banned-phrase test** across `/`, `/product`, `/method`, `/reports`, and the sample report: waitlist, "Live scanning: coming", "Deep Scan", "points gained per hour", "score-points per hour", "benchmarks you against peers", "scores each one", "102 inputs", "live engine: coming", "Past scans appear here".
- **Suppression matrix** across site report, CLI stdout, `report.html`, and `report.md`: scored runs carry the band CTA and `band=`; suppressed runs carry the verdict sentence, `verdict=insufficient-signal`, and no `band=`.
- **Local path-free test**: scan a uniquely named temp directory and assert the absolute path appears in none of `report.json`, `report.html`, or `report.md`.
- **Sample metadata test**: the sample's engine/rubric versions and coverage are either real or explicitly labelled authored; the sample marker is present on the list, detail title, and body.

**Why:** the current `chrome-honesty` test covers `/method` only, and the contracts test accepts the Low CTA. The product page can ship false claims while CI is green.

## Risks / Trade-offs

- **Shared CTA change touches every report surface** → migrate all callers in one pass; the suppression matrix is the release gate.
- **Unknown tier callers may break when the Moderate fallback is removed** → audit all callers; make unknown tiers throw in development and fail the test, rather than silently choosing a band.
- **Sample regeneration changes the home-page score and the pinned fixture tests** → land the subject-name fix first, then regenerate, then update the fixture and tests in one commit; keep the old fixture until the new one is verified.
- **`/assessment` vendor may not be ready** → the route and data-handling copy can ship with a `mailto:` fallback; wire the vendor when chosen without changing the report contract.
- **`/product` redirect may affect backlinks** → use a permanent redirect and keep the method page as the canonical destination; if SEO requires a page, add a short approved page later.
- **Badge snippet change is breaking for existing users** → release notes and a clear "local artifact, host it yourself" line; keep the permalink helper for future hosting.
- **Removing `local_path` may affect external consumers** → it was not part of the typed contract; search and document the change in release notes.
- **A regenerated sample may be suppressed** → choose a synthetic fixture that clears the coverage floor; if it does not, the sample is still honest but less useful, and the fallback is the real screenshot.

## Migration Plan

- No data migration. Existing envelopes remain readable; new local envelopes are name-only.
- Release notes: badge snippet no longer promises a hosted report; local reports name the directory instead of the path; sample report regenerated or labelled authored; `/product` redirects to `/method`.
- Rollback: revert the code; existing reports are unaffected. The badge link behavior can be restored with the capability flag. The sample fixture can be reverted independently.
- `/assessment`: ship the route with the mailto fallback first; replace the fallback with the vendor when configured. The report contract does not change.

## Open Questions

None. The booking vendor is deliberately deferred: the contract keeps the placeholder base URL, and the page ships with the mailto fallback. Replacing the fallback later does not change the specs or the approach.
