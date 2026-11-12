## Why

LeapScore is live at v1.0.2, but its public surface still describes a pre-launch product. The home page says "Live scanning: coming", offers a waitlist, promises a "Deep Scan" and "points gained per hour", and implies all 102 indicators are scored. The report's Low-band next step claims a peer benchmark that does not exist. A suppressed scan is still presented as a normal band on the site and in the CLI. The interactive sample is an authored mock with 49 "measured" rows and an engine string that says the live engine is coming, while a local scan runs 25 detectors. Local reports seal the absolute scan path into the artifact. The assessment destination every report points at has no route in this repository.

The GTM playbook makes the repo the source of truth and treats these as launch blockers through 1 December 2026. This change closes the gap between what the product says and what the product does, and encodes the truth as tests so it cannot drift again.

## What Changes

- **Public launch surface tells the shipped truth.** `/`, `/product`, `/method`, `/reports`, and the sample report stop describing a waitlist, an unshipped engine, "Deep Scan", "points gained per hour", "102 inputs", and "scores each one". The home page leads with the local install command, the sample report, coverage, and privacy; `/live` becomes a secondary public-repo demo.
- **Verdict-aware report next step.** Low loses the peer-benchmark claim. `insufficient-signal` gets its own sentence. A suppressed scan never receives a normal band CTA or a `band=<tier>` link on the site, CLI stdout, `report.html`, or `report.md`.
- **A real assessment destination.** `/assessment` resolves, books, and states how customer data is handled. The shared contract keeps a single placeholder base URL (`https://leapscore.dev/assessment`) until the booking vendor is selected, so every report CTA lands somewhere real without hardcoding a vendor URL.
- **Sample report is real or clearly authored.** Regenerate the interactive sample from a real v1.0.2 local scan where possible; otherwise mark it as an authored layout demo and show the product's real coverage beside it. Remove stale engine and rubric metadata, and label the sample on the list, detail title, and report body.
- **Local subjects are portable.** Seal the directory basename, not the absolute path. Drop `snapshot.local_path`. Make `meta.repoUrl` name-only or optional. Apply the same rule to the identity subject.
- **Badge stops implying a hosted report.** Badge snippets no longer wrap the SVG in a per-run permalink the deployment cannot resolve. The badge remains a self-contained static artifact; the host page decides whether to link it.
- **README and security disclosure.** The README first screen states the 102-indicator rubric, the up-to-31-detector coverage (25 on a local scan), and "not a benchmark". `SECURITY.md` publishes the disclosure path.
- **Regression tests encode the truth.** A banned-phrase test across public routes; a suppression matrix across site and CLI; a no-absolute-path test for local artifacts; a sample metadata/coverage test.

## Capabilities

### New Capabilities

- `launch-surface`: the public site's truth surface — home, product, method, sample-report labelling, and the reports index must describe only what v1.0.2 ships.
- `assessment-destination`: the `/assessment` route and its placeholder base URL — it must resolve, book, and state data handling.

### Modified Capabilities

- `release-funnel`: the next step becomes verdict-aware; Low loses the benchmark claim; suppressed reports get the `insufficient-signal` sentence and no band parameter.
- `report-rendering`: the CLI emitters and site report hero render the `insufficient-signal` verdict instead of a score plus band when the headline is suppressed.
- `scan-local`: local scan subjects are name-only in the sealed artifact; no absolute path or `file://` path is published.
- `report-identity`: the identity subject for a local scan is its directory slug, never an absolute path.
- `score-badge`: the embed snippet no longer promises a sealed-report permalink the deployment cannot resolve.
- `open-source-release-materials`: the README first screen states coverage and "not a benchmark"; a security disclosure path is published.

## Impact

- **Code**: `packages/contracts/src/index.ts` and its tests; `apps/scanner/src/scan/render.ts`, `scoring/seal.ts`, `scan/local.ts`, `bin/scan.ts`, and their tests; `apps/site/app/{page,product,method,reports,assessment}`, `apps/site/components/{report-view,report-next-step,identity-card}`, `apps/site/lib/{provider,reports}`, and site tests. `README.md`, new `SECURITY.md`.
- **Specs**: the eight capabilities above; `release-funnel`, `report-rendering`, `scan-local`, `report-identity`, `score-badge`, and `open-source-release-materials` receive delta files.
- **Risk**: changing the shared CTA helper touches every report surface; removing the badge permalink is a breaking change for existing snippets; regenerating the sample changes the pinned 58/Moderate fixture and its tests; the `/assessment` base URL is a placeholder until the booking vendor is selected, so the page must ship with a working fallback; local subject changes must not alter `runId` (it already uses the basename) or the score fingerprint.
- **Non-goals**: hosted report storage, a public peer benchmark or index, VS Code/PDF/AI features, new detectors, and any scoring-math change.
