# LeapScore site

Marketing + product site for LeapScore. Built with Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-nova preset over Base UI), **exported as a server-free static artifact** and deployed to GitHub Pages.

**The site never executes a scan and has no server runtime.** Every route is a committed document or a build-time rendering of committed inputs; nothing reads a request header, cookie, query string, or filesystem at request time. `tooling/checks/site-boundary.ts` fails the check if the served graph reaches `apps/scanner` or imports `fs`/`child_process` in any form (`fs`, `node:fs`, `fs/promises`, …) outside build tooling.

## Routes

- `/` — marketing hero. The local install command is the primary CTA, the sample gallery is the secondary proof, and coverage and privacy sit above the fold. The report teaser is the first committed sample envelope, labelled illustrative. No repository input and no scan surface exist.
- `/samples` — the gallery of committed sealed envelopes from real scans of checked-in synthetic fixtures. Rows carry the illustrative label before any score, plus the sealed score or suppressed verdict, tier, and coverage. The set grows by adding a file under `lib/samples/`.
- `/samples/[slug]` — one pre-rendered sample detail (`generateStaticParams` over the sample set). It reuses the sealed report presentation and the stored trace as the scan log. Unknown slugs render the not-found document.
- `/assessment` — the destination every report CTA opens. Static shell plus a client component that reads `utm_campaign`, `band`, and `verdict` from the visitor's URL in the browser, so attribution survives static hosting. A booking link or `mailto:` fallback preserves only campaign/band/verdict.
- `/rubric` — the rubric index: ten category rows with weight, row count, tier mix, and default-status mix; the release coverage strip (measured / estimated / unknown / not implemented, with the detector count and engine version); and a client search/filter island over the 102-row index payload.
- `/rubric/[categoryId]` — one pre-rendered category table: every indicator with ID, name, engine tier, default status, verify effort, gates fed, and rollup. Each row links to its own document. All ten category pages are pre-rendered.
- `/rubric/[categoryId]/[indicatorId]` — one pre-rendered document per indicator (`generateStaticParams` over the compiled registry, `dynamicParams = false`): the four-level 0–3 criteria, the yellow/red flag pair with rationale, the remediation trio, applicability, statusing, score mapping, fact schema, evidence, scope/overlaps, gates fed, a committed-sample evidence link when one exists, and prev/next navigation. Unknown IDs render the not-found document.
- `/method` — scoring model, weights, tiers, the kill-switch gate cap, and the current scan paths (local CLI and CI only).
- `/methodology` — a forwarding document for the methodology URL the CLI writes into every `report.html`/`report.md`. A static host serves no redirects, so it resolves the sibling `/method/` path from its own location and keeps a plain relative-link fallback (`release-funnel`, asserted by `lib/methodology-link.test.ts`).
- `/product` — the same forwarding pattern; the retired product path publishes no narrative of its own.
- Unknown paths — the site's own not-found document (`404.html`), which links home.

### Removed surfaces

`/live`, `/report/live`, `/reports`, `/reports/[runId]`, and `/reports/[runId]/raw` are gone, along with `LiveReportClient`, `UrlBox`, `lib/scanner.ts`, `lib/reports.ts`, `lib/provider.ts`, and `NEXT_PUBLIC_SCANNER_URL`. Direct links to them resolve through the not-found document. The scanner service still owns scanning; the site simply carries no consumer of it.

## Deployment

The export is produced by `npm run build --workspace @leapscore/site` and written to `apps/site/out/`. The build writes `.nojekyll` (so Pages does not drop `_next/`) and runs `scripts/assert-export.ts`, which fails on any `__next_error__` document, any internal root-absolute URL that escapes the base path, or a missing forwarded document.

`.github/workflows/pages.yml` builds on every pull request and on `main`, uploads the artifact, and deploys only from `main` through the Pages artifact flow. No `gh-pages` branch and no committed build output.

**One-time repository setup:** Settings → Pages → Build and deployment → Source: **GitHub Actions**. No branch folder is selected.

**The one value to change for hosting** is `SITE_BASE` in `apps/site/lib/base-path.ts`:

| Deployment | `SITE_BASE` |
| --- | --- |
| GitHub Pages project site (default) | `https://open-legacyleap.github.io/leapscore` |
| Custom domain at the origin root | `https://leapscore.dev` |
| Origin root under the default host | `https://open-legacyleap.github.io` |

`SITE_BASE` derives `basePath`, `assetPrefix`, and `metadataBase`. Flip it and rebuild; every internal link, font, chunk, and canonical URL follows with no other edit. For the custom domain, also add the domain in the repository's Pages settings (which writes the `CNAME`) and point DNS at GitHub Pages.

Until the custom domain is pointed here, the `https://leapscore.dev/...` links baked into shipped CLI reports and the badge do not resolve to this site. That gap is disclosed in the change and closes when `SITE_BASE` flips; the contract constants are intentionally untouched.

## Architecture

- `lib/types.ts` — the report contract, re-exported from `@leapscore/contracts` (producer-owned; the site declares no second authoritative `Report`).
- `lib/base-path.ts` — the single build-time deployment value (`SITE_BASE`), composing the serving path, origin, and base URL. It is the only module that reads that input.
- `lib/source-links.ts` — the public repository URL and its display label, declared once and imported by the footer, the home licence badge, and `/method`. Both are static anchors: no GitHub API call and no repository-derived data at build time.
- `lib/samples.ts` — the committed sample set: validates contract version and envelope shape, derives the stable slug from the file name, and sorts by sealed `ranAt` (descending) then slug.
- `lib/generated/samples.ts` — generated by `scripts/build-samples-manifest.ts` from `lib/samples/*.json` (do not hand-edit). The directory listing is the manifest; `SAMPLE_ROW_INDEX` maps every indicator a committed envelope carries to its sample slug and report anchor.
- `lib/generated/coverage.ts` — generated by `scripts/build-coverage-manifest.ts` from the shipped detector tree and `apps/scanner/package.json` (do not hand-edit). It carries the implemented indicator IDs, the engine version, and the 102-row denominator.
- `lib/coverage-claim.ts` — the one public coverage sentence. The count and version come from the generated manifest; the claim version is asserted against it so a release cannot drift the copy silently.
- `lib/rubric-index.ts` — the rubric index: category summaries, release-status counts, and the classification-only payload the search island receives.
- `lib/rubric-filter.ts` — the search/filter predicate. It imports the entry type only, so the client island never reaches the prose registry.
- `lib/rubric-links.ts` — the only module that composes rubric URLs (`categoryHref`, `indicatorHref`); the two-digit prefix comes from `CATEGORY_ORDER`.
- `lib/categories.ts` — the 10-category metadata (name, one-liner, weight); imported by `/method`.
- `lib/scoring.ts` — exact rational scoring (BigInt lcm denominators); mirrors `docs/rubric/model/config.md` §1–§3. Band vocabulary `Low/Moderate/High/Critical` with the one-release legacy aliases (`Healthy`/`High Risk`) mapped.
- `lib/assessment.ts` — a pure function of a params object: whitelisted campaign/band/verdict attribution and the `mailto:` fallback. The destination itself is `ASSESSMENT_BASE_URL` from `@leapscore/contracts`.
- `components/report-view.tsx` — the shared sealed-report presentation used by the sample detail. Its only history-shaped affordance is the back link to `/samples`; every graded row links to its rubric document.
- `lib/generated/rubric.ts` — compiled registry (do not hand-edit; `npm run compile:rubric` from root regenerates it from `docs/rubric/indicators/` and `docs/rubric/model/config.md`). It carries identity, classification, rubric semantics, contract detail, remediation, and `CATEGORY_CHARTERS`; the served graph parses no rubric markdown. The retired `lib/parse-rubric.ts` and `app/rubric/rubric-browser.tsx` are gone.

## Commands

- `npm run dev` — dev server (routes render on demand in dev; the artifact is what ships).
- `npm run build` — static export. `prebuild` regenerates the sample manifest and the coverage manifest; `postbuild` writes `.nojekyll` and asserts the artifact.
- `npm run check:export` — rerun the artifact assertions against an existing `out/`.
- `npm run lint` — eslint.
- `npm test` — vitest. `lib/score.consistency.test.ts` pins the committed sample's sealed headline and coverage; `lib/registry.test.ts` asserts the compiled registry matches the engine; `lib/coverage.test.ts` asserts the generated coverage manifest matches the detector tree and the claim version; `lib/sample-row-index.test.ts` asserts every committed envelope row is indexed; `lib/rubric-links.test.ts`, `lib/rubric-routes.test.tsx`, `lib/rubric-palette.test.ts`, and `lib/rubric-affordance.test.tsx` hold the rubric browser; `lib/samples.test.ts` covers ordering, invalid documents, unsupported contract versions, and slug derivation; `lib/claim-honesty.test.tsx` holds the public claim register; `lib/forwarding-redirect.test.tsx` holds the forwarded paths; `components/gate-cap.test.tsx` and `lib/methodology-link.test.ts` hold the report surfaces and the CLI link in lockstep with the contract.
- `npm run format` — prettier (JS/TS; Tailwind plugin).

## Rules (hard)

- Sample surfaces are stamped illustrative on every view; there is no live or persisted surface on the site.
- Branding: LeapScore, leapscore.dev, dial/gauge mark.
- Color is reserved for band tiers (≥80 green, 53–79 amber, 27–52 red, <27 deep red). Everything else is neutral.
- Never hand-edit a derived number: category %, weighted contribution, headline — all recomputed via `lib/scoring.ts`. Never hand-edit `lib/generated/rubric.ts` or `lib/generated/samples.ts`.
- Never type an internal root-absolute URL: navigation uses `next/link` (which applies `basePath`), and relative fallbacks are relative on purpose.
- Never restate shared wording or thresholds in a component: band vocabulary, band colors, the next-band-path block, the gate-cap sentence, the positioning line and the assessment CTA all come from `@leapscore/contracts`, so the site and the CLI reports cannot drift.

## Note on derived percentages

The committed samples are the scanner's sealed envelopes, so their counts (for the Maven sample: 13 measured, 1 estimated, 14 unknown, 3 not applicable, 71 not implemented) and their percentages come from the seal. The site never re-derives a headline: `lib/samples.ts` returns the sealed report and its meta.
