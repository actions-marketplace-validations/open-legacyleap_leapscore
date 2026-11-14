## 1. Static export foundation

- [x] 1.1 Set `output: "export"` and `trailingSlash: true` in `apps/site/next.config.ts`; verify `npm run build --workspace @leapscore/site` emits `apps/site/out/` and names no route that needs on-demand rendering
- [x] 1.2 Add `generateStaticParams` to `apps/site/app/rubric/[categoryId]/page.tsx` derived from `parseRubric()`; verify `out/rubric/01` through `out/rubric/10` each contain a real category document and none contain `__next_error__`
- [x] 1.3 Add `apps/site/lib/base-path.ts` exporting the single build-time base path and the composed site origin; verify it is the only module that reads the base-path input (search for other `process.env` base-path reads and confirm none)
- [x] 1.4 Wire `basePath`, `assetPrefix`, and `metadataBase` in `next.config.ts` and `app/layout.tsx` from `lib/base-path.ts`; verify every internal `href`, font, and chunk URL in the exported documents carries the prefix
- [x] 1.5 Add `apps/site/scripts/assert-export.ts` that fails when (a) any exported document contains `__next_error__`, (b) an internal root-absolute URL escapes the base path, or (c) a forwarded path (`/methodology`, `/product`) has no exported document; verify it fails when run against the current `apps/site/out/` artifact
- [x] 1.6 Write `.nojekyll` into the export as part of the build; verify the file exists in `out/` after a build

## 2. Forwarding documents

- [x] 2.1 Replace the `permanentRedirect` in `apps/site/app/methodology/page.tsx` with a forwarding document that derives its target from `location.pathname` and offers a plain link fallback; verify the exported document forwards to the sibling `method/` path both under the base path and with an empty base path
- [x] 2.2 Replace the `permanentRedirect` in `apps/site/app/product/page.tsx` with the same forwarding pattern; verify the exported document contains no page narrative and forwards to the method page
- [x] 2.3 Add a test that both forwarded paths export a forwarding document (not an error page, not duplicated content); verify it fails before 2.1/2.2 and passes after
- [x] 2.4 Add the `lite` markup requirement to the forwarding document: when scripts are blocked, a visible link to the method page remains; verify by rendering the document without executing scripts

## 3. Sample gallery

- [x] 3.1 Move the committed envelope to `apps/site/lib/samples/maven-multi-module.json` and add `apps/site/lib/samples.ts` that lists, validates (contract version, envelope shape), and sorts samples deterministically by sealed `ranAt` then slug; verify a unit test covers ordering, an invalid document, and an unsupported contract version
- [x] 3.2 Add `apps/site/app/samples/page.tsx` listing every sample with repository, sealed score or suppressed verdict, tier, coverage, and the illustrative label; verify the rendered row shows the label before any score
- [x] 3.3 Add `apps/site/app/samples/[slug]/page.tsx` with `generateStaticParams` over `lib/samples`, rendering via the existing `report-view` and scan-trace components; verify `out/samples/maven-multi-module/index.html` exists and contains the sealed score
- [x] 3.4 Retarget the `report-view` history back-link so the sample detail has no link to a removed run-history path; verify the rendered detail contains no `/reports` href
- [x] 3.5 Point the home page teaser at the first sample from `lib/samples.ts` and delete `apps/site/lib/provider.ts` and its test; verify the home page renders the sealed score and `npm test --workspace @leapscore/site` reports no missing module
- [x] 3.6 Add a test that a second committed sample file appears in the gallery and at its own path after a rebuild with no route change; verify it fails with a single fixture and passes with two
- [x] 3.7 Verify provenance on the sample detail names the envelope's own `engine_version` and `rubric_version`; verify with a test asserting those strings appear before the first score

## 4. Remove the live and history surfaces

- [x] 4.1 Delete `app/live/`, `app/report/live/`, `components/url-box.tsx`, and `lib/scanner.ts`; verify `next build` succeeds and the export contains no `/live` document
- [x] 4.2 Delete `app/reports/`, `app/report/sample/`, and `lib/reports.ts`; verify no exported document exists under `/reports` and the build resolves no import of the deleted module
- [x] 4.3 Remove the repository-input section from `app/page.tsx` and replace the secondary call to action with the sample gallery link; verify the home page contains no repository input and no link to a scan surface
- [x] 4.4 Update the home page metadata description in `app/layout.tsx` so it no longer promises scoring a repository from the site; verify the exported `<meta name="description">` contains no such promise
- [x] 4.5 Reduce `components/site-header.tsx` nav to `Samples`, `Method`, `Rubric` and remove the retired entries from `components/footer.tsx`; verify a test asserts exactly three nav links and no live or history target
- [x] 4.6 Remove the live-scan wording from `app/method/page.tsx`; verify the method page render contains no link to or description of a website scan
- [x] 4.7 Remove the `apps/site/lib/reports.ts` exemption from `tooling/checks/site-boundary.ts`; verify `npm run check:site-boundary` passes with the exemption gone
- [x] 4.8 Remove the now-unused `NEXT_PUBLIC_SCANNER_URL` from local env documentation and any `.env.example`-style reference; verify a repository search finds no remaining reference in the served graph

## 5. Assessment attribution

- [x] 5.1 Split `app/assessment/page.tsx` into a static shell plus a client component that reads `utm_campaign`, `band`, and `verdict` via `useSearchParams()` inside a Suspense boundary, keeping `lib/assessment.ts` a pure function of the params object; verify the site build succeeds with no `searchParams` page prop
- [x] 5.2 Verify the exported assessment document carries the default attribution and that a hydrated page opened with `?utm_campaign=cli-scan-v1&band=high` renders the band and campaign from the URL; verify with a component test plus a manual check against the built artifact
- [x] 5.3 Verify the whitelist still rejects an unknown band and the verdict-only path still suppresses the band; verify with the existing `lib/assessment` tests extended to the client path

## 6. Deployment

- [x] 6.1 Add `.github/workflows/pages.yml` building the site on `pull_request` and on the default branch, uploading the artifact and deploying only on the default branch, with `pages: write`, `id-token: write`, a `github-pages` environment, and a `pages` concurrency group; verify the workflow YAML parses and a pull-request run builds without deploying
- [x] 6.2 Run `npm run check:site-boundary`, `npm run check:dist`, and every other `check:*` from the root against the changed tree; verify all pass with no new exemption
- [x] 6.3 Confirm the export contains no generated site directory tracked by git and that `apps/site/out/` remains ignored; verify with `git status --porcelain` after a build
- [x] 6.4 Document the one-time Pages setup (source: GitHub Actions) and the base-path/custom-domain switch in `apps/site/README.md`; verify the instructions name the single value to change
- [x] 6.5 Verify a base-path flip changes every internal URL with no other edit: build once with the project prefix and once with an empty base path, and confirm the diff is confined to the configured value; verify by comparing exported link prefixes

## 7. Tests and docs

- [x] 7.1 Rewrite `lib/claim-honesty.test.tsx` to import the sample gallery and sample detail instead of `/reports` and `/reports/[runId]`, and to assert the home page offers no repository input; verify the banned-phrase suite passes
- [x] 7.2 Update `lib/chrome-honesty.test.tsx` so it no longer asserts a live-scan affordance and instead asserts the chrome names only local and CI scan paths; verify it passes
- [x] 7.3 Update `lib/methodology-link.test.ts` to assert the forwarded path is a served document rather than an HTTP redirect; verify it passes and still pins `METHODOLOGY_URL`
- [x] 7.4 Replace `lib/reports.test.ts` with `lib/samples.test.ts` covering ordering, invalid documents, unsupported contract versions, and slug derivation; verify it passes
- [x] 7.5 Update the root `AGENTS.md` site bullet and `apps/site/README.md` route table so they describe the static export, the sample gallery, and the removed surfaces; verify `npm run check:documentation-structure` passes
- [x] 7.6 Update `openspec/specs/` statements that name `/live` or `/reports` outside this change's deltas — specifically the `scanner-service` and `release-publication` references — so the current-truth tree cites no removed path; verify a repository search for `/live` and `/reports/` under `openspec/specs/` returns only historical context that intentionally names the removal
- [x] 7.7 Run `npm run release:gates` from the root; verify every check, bundle parity, and workspace suite passes
