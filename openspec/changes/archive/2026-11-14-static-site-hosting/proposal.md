## Why

The site is a Next.js app with a server runtime, so it can only be published from a host that renders pages on demand. We want it on GitHub Pages — a static artifact, no server, no vendor — without paying for a custom domain yet, while leaving the door open to `leapscore.dev` later. Two of the site's current surfaces exist only because a server exists: the `/live` demo (it fetches the scanner cross-origin and streams NDJSON) and the `/reports` run history (it pretends to be a store). Neither is needed for the product's claim, and both are what make the site non-static.

A static export of this tree was already attempted locally on 14 Nov 2026 and the artifact is still in `apps/site/out/`. It shows exactly what breaks: the three `permanentRedirect` routes export as error pages, the `/assessment` page renders its attribution from build-time-empty search params, and `/rubric/[categoryId]` only builds with a `generateStaticParams` that was reverted. This change finishes that migration deliberately, retires the two server-shaped surfaces, and makes the deployment reproducible in CI.

## What Changes

- **The site becomes a static export.** `apps/site` builds to a plain directory of HTML/assets and nothing at request time reads a URL, a header, or a filesystem. **BREAKING**: every route that needs a server is removed or converted.
- **Live scanning leaves the site.** `/live`, `/report/live`, `LiveReportClient` (501 lines), the paste-a-repo `UrlBox`, `lib/scanner.ts`, and `NEXT_PUBLIC_SCANNER_URL` are deleted. The scanner service and `GET /scan` are untouched — this removes the consumer, not the producer.
- **Run history leaves the site.** `/reports`, `/reports/[runId]`, `/reports/[runId]/raw`, `lib/reports.ts`'s ingest/runId machinery, and the "Rerun" affordance are deleted. There are no previously-run scans on the site.
- **The sample report becomes a sample gallery.** One committed sealed envelope today, more later. `/samples` lists them and `/samples/[slug]` renders one, driven by build-time fixtures and `generateStaticParams`. The sample keeps its `sample: true` labelling and its existing disclosure rules.
- **Redirect routes become static stubs.** `permanentRedirect` does not survive `output: "export"` — it emits an error page. `/methodology` (linked from every generated CLI report) and `/product` become client-side redirect documents that resolve the target from the current path, so they work under a base path and under the future custom domain without edits.
- **Assessment attribution reads the URL in the browser.** The page stops consuming `searchParams` on the server, where static export freezes it at build time, and reads `utm_campaign` / `band` / `verdict` client-side so the CLI funnel still attributes.
- **One base-path knob, no custom domain yet.** The site deploys as a GitHub Pages project site under `/leapscore/`, so every internal link, asset, and canonical URL is generated from a single build-time base-path value. Flipping to `leapscore.dev` later is one value plus a `CNAME`.
- **Deployment moves into CI.** A Pages workflow builds the site, uploads the artifact, and deploys it. No `gh-pages` branch, no committed build output.
- **Known staging gap, disclosed:** until the custom domain lands, every `https://leapscore.dev/...` link baked into `report.html`, `report.md`, and the badge points at an origin that does not serve this site yet. The contract constants are not changed by this change — changing them would require a scanner release and would have to be changed back.

## Capabilities

### New Capabilities

- `static-hosting`: the site is a server-free static artifact — export config, base path, client-side-only request state, redirect stubs, 404 handling, and the GitHub Pages deployment.
- `sample-reports`: the committed sample gallery — which envelopes ship, how they are listed and addressed, and how they are labelled as illustrative.

### Modified Capabilities

- `site-shell`: the header nav drops `Reports`, `Product`, and `Sample report` and carries no reference to live or history affordances.
- `launch-surface`: the home page no longer offers a public-repo live demo; the paste-a-repo section and the "paste any GitHub repo" description are removed, and the sample gallery is the secondary proof.
- `scan-phase-1`: the site-side live-report requirements (`/live` page, score-this-repo CTA, scan timeline events) are removed; the scanner-side unified scan requirements are unchanged.
- `reports/run-history-ui`: the run-history capability is retired wholesale.
- `reports/persisted-runs`: fresh-run routing no longer references a live demo or a site-owned history entry; the runId grammar, envelope, and CLI producer requirements are unchanged.
- `report-rendering`: the live-report chrome requirement is retargeted to the sample report detail, since `/live` no longer exists.
- `release-funnel`: the methodology link resolves through a static stub instead of an HTTP redirect, and the method page states local CLI only.
- `assessment-destination`: attribution is read from the URL in the browser and survives static hosting rather than being resolved at build time.

## Impact

- **Code**: `apps/site/next.config.ts` (export + base path), `apps/site/app/{live,report,reports,rubric,assessment,methodology,product}`, `apps/site/components/{url-box,site-header,footer,report-view,report-next-step}`, `apps/site/lib/{scanner,reports,provider,assessment}`; new `apps/site/lib/{samples,base-path}`, new `/samples` routes, a static redirect component; site tests that import the removed routes.
- **New**: `.github/workflows/pages.yml`; a build script that writes the base path into the export and emits `.nojekyll`.
- **Specs**: two new capabilities plus eight delta files.
- **Risk**: (a) the rubric category pages are 13 MB of the 15 MB export — within the Pages limit but worth watching as samples grow; (b) GitHub Pages has no PR previews, so a broken build is only visible after merge unless the workflow also builds on `pull_request` without deploying; (c) the base path must not leak into the committed CLI contract constants; (d) `/methodology` is linked from every sealed report, so its stub is the highest-consequence detail in the change.
- **Non-goals**: registering a custom domain, changing `packages/contracts` URL constants, a hosted report store or per-run permalinks, restoring the raw-JSON download for samples, and any scanner, detector, or scoring change.
