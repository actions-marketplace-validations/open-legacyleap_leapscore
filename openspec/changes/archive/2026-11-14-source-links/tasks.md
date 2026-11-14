## 1. Source constant

- [x] 1.1 Add `apps/site/lib/source-links.ts` exporting the repository URL (`https://github.com/open-legacyleap/leapscore`) and its display label, with a comment naming it as the site's only copy. Verify `npm run lint --workspace @leapscore/site` passes and no component types a `github.com/open-legacyleap` literal.

## 2. Surfaces

- [x] 2.1 Add `Source` to the footer's existing link row in `apps/site/components/footer.tsx`, pointing at the constant. Verify the rendered footer markup contains an anchor whose `href` is exactly the repository URL.
- [x] 2.2 Wrap the home hero's existing `Local-first · Apache-2.0 · no telemetry` badge text in an anchor to the constant (`apps/site/app/page.tsx`), keeping the badge's classes and layout. Verify the home markup contains the anchor and the badge still renders as one line on a narrow viewport.
- [x] 2.3 Add one sentence plus a repository link to the closing section of `apps/site/app/method/page.tsx`, naming the scanner, the canonical catalog, and the report schema as what the repository holds. Verify the method page renders exactly one repository anchor and the banned-claim register still passes.

## 3. Guards and verification

- [x] 3.1 Extend the site tests: assert `SiteHeader` still renders exactly three nav links (`Samples`, `Method`, `Rubric`) with no repository link, and assert the footer plus every licence/auditability surface links the same URL. Verify `npm test --workspace @leapscore/site` passes.
- [x] 3.2 Assert the static artifact is network-free: no `api.github.com` (or other repository host) in `apps/site/out/` and no `fetch` on the served graph. Verify `npm run build --workspace @leapscore/site` followed by `npm run check:export --workspace @leapscore/site`.
- [x] 3.3 Run the boundary gates from the repository root: `npm run check:site-boundary` and `npm run check:documentation-structure`. Verify both exit zero.
- [x] 3.4 Update `apps/site/README.md` Routes/Architecture notes only if a route description or module list changes; verify the README names `lib/source-links.ts` once if it is added to the module list.
