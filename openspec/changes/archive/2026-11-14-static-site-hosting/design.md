## Context

See `proposal.md` — Why. Six constraints from the current tree shape the approach.

- **The export mechanism already exists and half-works.** `apps/site/out/` is a static export produced on 14 Nov 2026 and `.next/required-server-files.json` records the config used: `output: "export"`, `trailingSlash: true`. So the mechanical export is proven; what failed is what the artifact contains. `out/product/index.html`, `out/methodology/index.html`, and `out/report/sample/index.html` all carry `<html id="__next_error__">` — `permanentRedirect()` does not survive export. `out/assessment/index.html` renders `Campaign: cli-scan-v1`, the build-time default, proving `searchParams` is frozen. `out/rubric/01..10` exist only because a `generateStaticParams` was added for that build and reverted; at HEAD it is absent, so a fresh export fails on that route.
- **The CLI writes `leapscore.dev` into every artifact.** `METHODOLOGY_URL`, `ASSESSMENT_BASE_URL`, and `REPORT_BASE_URL` live in `packages/contracts` and ship inside the published bundle. The site's origin is therefore a released-software concern, not a hosting preference.
- **Two surfaces exist only because a server exists.** `/live` streams NDJSON cross-origin from the scanner; `/reports` is a fixture-backed pretense of a store. Both are removed, not ported.
- **The report presentation is shared.** `components/report-view.tsx` renders the sample today and is the surface a sample gallery needs. Its one history-specific affordance (a back link to `/reports`) is the only thing to change.
- **Boundary checks already encode the split.** `check:site-boundary` forbids the served graph from reaching `apps/scanner` or `node:fs`, and currently exempts `apps/site/lib/reports.ts`. That exemption becomes dead code when the history reader is deleted.
- **Tests pin the removed routes.** `lib/claim-honesty.test.tsx` imports `/reports` and `/reports/[runId]` directly; `lib/chrome-honesty.test.tsx` asserts the chrome mentions a live scan; `lib/methodology-link.test.ts` pins `/methodology` as a route.

## Goals / Non-Goals

**Goals:**

- Produce a static artifact that serves correctly from a GitHub Pages project path today and from `leapscore.dev` later with one value changed.
- Remove the two surfaces that require a server, without weakening the scanner or the report contract.
- Keep the sample report as the site's proof asset, as a set that can grow.
- Make the deployment reproducible in CI and impossible to ship half-converted.

**Non-Goals:**

- Registering a custom domain, or changing any `packages/contracts` URL constant.
- A report store, per-run permalinks, or a raw-JSON download for samples.
- Restoring the paste-a-repo demo in any form.
- Any scanner, detector, scoring, or rubric change.
- Redesigning the marketing copy beyond removing claims about a website scan.

## Decisions

### D1. `output: "export"` with `trailingSlash: true`

The site builds with `output: "export"` and `trailingSlash: true`.

**Why:** export is the only Next mode that produces a servable tree with no Node process, and `trailingSlash` makes Next emit `…/index.html` plus matching trailing-slash hrefs — the shape GitHub Pages serves natively. Without it, every link would take an extra 301 hop through the host's directory redirect. The 14 Nov artifact was built this way, so the settings are already known-good.

**Alternatives considered:** a static rewrite in another framework (rejected: throws away the rubric browser and the report components); prerendering with a Node runtime behind a host that supports it (rejected: the point is no server).

**Consequence:** server-only APIs become build errors rather than runtime surprises. That is the desired behavior — the converter should not be able to leave a route half-migrated.

### D2. One base-path value, two deployment states

A single build-time value produces `basePath`, `assetPrefix`, and `metadataBase`. Today it is the project prefix `/leapscore`; later it is empty with a `CNAME` for `leapscore.dev`.

**Why:** GitHub Pages serves a project site under `/<repo>/`, and every internal URL — nav links, fonts, chunk URLs, canonical and social metadata — must be generated from that prefix rather than typed. Keeping it as one value is what makes the custom-domain migration a config change instead of an audit.

**Alternatives considered:** deploy to a `open-legacyleap.github.io` user-site repository so the site sits at the origin root (rejected: splits the site from its repo and its history for no gain, and still is not `leapscore.dev`); hardcode `/leapscore` (rejected: the "later" migration then touches every document that hardcoded it).

**Constraint:** `packages/contracts` constants are **not** touched. The base path belongs to the site's build, and the contract's absolute URLs stay as released. See D8 for the consequence.

### D3. Relocated paths become forwarding documents, not redirects

`/methodology` and `/product` are served as small client-side forwarding documents that derive their target from their own pathname (`/methodology/` → sibling `method/`), falling back to a link if scripting is unavailable.

**Why:** the 14 Nov artifact proves `permanentRedirect()` exports as the error page, and GitHub Pages serves no server redirects at all. Deriving the target from `location.pathname` rather than from a configured prefix means the same document works at `/leapscore/methodology/` today and `leapscore.dev/methodology/` later, with no rebuild-time coupling.

**Alternatives considered:** a `_redirects` file (unsupported by Pages); a Netlify/Cloudflare host that supports redirects (rejected as the constraint is GH Pages); duplicating the method page at `/methodology` (rejected: two URLs for one document, and the user asked for no duplicates).

**Priority:** `/methodology` is the highest-consequence path in this change — every sealed report links to it. It gets a test that asserts the exported document exists and forwards, not merely that the source compiles.

### D4. The sample is a member of a set, keyed by file name

Samples live as committed envelopes under `apps/site/lib/samples/<slug>.json`. `/samples` lists them; `/samples/[slug]` pre-renders one via `generateStaticParams` over that directory. The URL is the file's slug, not the envelope's `runId`.

**Why:** the user expects more samples later, and the sample set must grow by dropping in a file. `runId` embeds the engine sha and the scan timestamp, so it changes whenever a sample is re-sealed — a bad primary key for a URL that the home page and inbound links point at. A file name is stable by construction, and a second sample of the same repository is expressible by choosing a different file name. Ordering is deterministic (by sealed `ranAt`, descending, then slug) so an unchanged input set produces a byte-identical gallery.

**Alternatives considered:** keep `/reports/<runId>` (rejected: the URL names a run history that no longer exists, and re-sealing a sample breaks the link); a manifest file listing samples (rejected: a second place to update; the directory listing already is the manifest, matching how the rubric catalog derives from its tree).

**Consequence:** the home page's teaser and the gallery read the same module, so `lib/provider.ts` collapses into it rather than remaining a second seam over the same fixture.

### D5. Query-string state is read in the browser

`/assessment` keeps `lib/assessment.ts` as a pure function of a params object and moves the params read into a client component wrapped in a Suspense boundary.

**Why:** the 14 Nov artifact renders the build-time default, so a report CTA's `utm_campaign`/`band`/`verdict` silently becomes `cli-scan-v1` on a static host. That is a funnel regression invisible in a local `next dev` (which renders per request), so it needs to be fixed where it is read, not patched at the emitter.

**Alternatives considered:** redirect the query string into a hash (adds a hop and a second rendering path); drop attribution (rejected: the funnel's only measurement).

### D6. Delete the server-shaped code rather than feature-flag it

`/live`, `/report/live`, `LiveReportClient`, `UrlBox`, `lib/scanner.ts`, `NEXT_PUBLIC_SCANNER_URL`, `/reports`, `/reports/[runId]`, `/reports/[runId]/raw`, and `lib/reports.ts` are removed. `report-view.tsx` stays for the sample detail with its back link retargeted. The `lib/reports.ts` exemption in `check:site-boundary` is removed with it.

**Why:** a flag that can re-enable a scan client is a build input that can put a scanner origin back into the artifact. The static boundary is easier to enforce when the code is gone. Deleting the reader also deletes the last exemption in the boundary check, so the check gets stricter for free.

**Alternatives considered:** keep the code behind a flag for a later hosted-site revival (rejected: git history is the revival path, and the flag would need a test to stay honest).

### D7. Deploy with the Pages artifact flow, never a `gh-pages` branch

One workflow builds the site and publishes the artifact through the Pages deployment actions. It builds on pull requests without deploying, and deploys on the default branch.

**Why:** no build output in version control, no orphan branch to reconcile, and the deployed bytes are the bytes CI built. A PR build catches the class of failure this change exists to prevent — an export that succeeds while emitting a broken document — before merge, since Pages has no preview deploys.

**Alternatives considered:** commit `out/` to a `gh-pages` branch (rejected: binary history, and `check:dist`-style freshness checks would be needed for it); deploy from the local machine (rejected: unreproducible).

**Manual prerequisites** (external to the repo, checked at apply time): Pages enabled with source "GitHub Actions", and — once the domain lands — the custom domain configured with the repository's `CNAME` and DNS records.

### D8. Accept the `leapscore.dev` gap, and disclose it

The contract constants are left untouched. Until the custom domain is pointed at Pages, `https://leapscore.dev/methodology`, `…/assessment`, and the badge's report base do not resolve to this site.

**Why:** changing the constants would require a `leapscore-scan` release, put a second engine version into the wild linking at `github.io/leapscore`, and then require a second release to change back. The gap is temporary, disclosed, and bounded — the site itself works; only links inside already-generated artifacts point at a name that is not yet pointed here.

**Alternatives considered:** point the constants at the Pages project URL (rejected: permanent artifact churn for a transient state); ship without the site (not the ask).

**Follow-up, not this change:** when the domain lands, D2 flips and the gap closes with no artifact churn.

### D9. The raw-JSON download is deferred

Samples ship as rendered pages only. The `raw` route handler was a dynamic handler whose static output is an extensionless file that Pages serves as a download with the wrong content type.

**Why:** not worth introducing a second generated-artifact path for this change. The eventual shape is a literal `report.json` path segment, which exports to a real `.json` file with the correct content type; that is recorded here so the next change does not rediscover it.

### D10. Keep the per-category rubric pages, watch the weight

The rubric browser keeps its ten pre-rendered category pages. They are 13 MB of the 15 MB export because each ships its HTML plus two copies of the RSC payload.

**Why:** within the Pages limit, already working, and unrelated to the hosting question. The alternative — one client-rendered rubric page keyed on a query parameter — is recorded as a follow-up if the export outgrows the limit as samples are added.

## Risks / Trade-offs

- **A silently broken document is the failure mode, not a failed build.** The 14 Nov export succeeded while emitting three error pages. → Mitigation: assert on artifact contents (a forwarding document exists and forwards; a sample page contains its sealed score; no `__next_error__` document is exported), not only on a green build.
- **`/methodology` is linked from every sealed report.** → Mitigation: it gets an artifact-level test, and D3 makes it prefix-independent so the domain migration cannot break it.
- **Base path leaks.** A single raw `href="/…"` or asset URL bypasses `next/link` and breaks under `/leapscore/`. → Mitigation: the base path is read from one module, and a test walks the exported documents for root-absolute internal URLs.
- **Hidden attribution regression.** Local dev renders per request, so the frozen-`searchParams` failure is invisible there. → Mitigation: the test runs against the exported document, and asserts on the client-resolved value.
- **No preview deploys.** A broken build is only visible after merge. → Mitigation: build on `pull_request` without deploying, plus the artifact assertions above.
- **Export weight grows with samples.** Each sample detail ships the full 102-row table. → Mitigation: D10; revisit if the artifact approaches the Pages limit.

## Migration Plan

1. Add the static-hosting foundation: export config, the base-path module, the forwarding document, the deploy workflow.
2. Convert the sample surface: `lib/samples/` fixtures, `lib/samples.ts`, `/samples` and `/samples/[slug]`, retarget the home teaser and `report-view`.
3. Delete the live and history surfaces, and the boundary exemption they owned.
4. Convert `/assessment` to client-side attribution.
5. Rewrite the affected tests, then verify against the exported artifact rather than the dev server.

Rollback: revert the change. The site was never published from a static host, so there is no deployed state to unwind, and no contract, scanner, or release artifact changed.

## Open Questions

- Does the repository's Pages settings need enabling manually before the first deploy, or is that acceptable as a documented one-time step? (Assumed manual; recorded under D7.)
- When the custom domain lands, should the Pages project path keep serving or 301 to the apex? (Out of scope; the forwarding-document pattern in D3 makes either cheap.)
