## 1. Metadata

- [x] 1.1 Set `action.yml` `name` to `LeapScore scan` and verify the slugified form equals the package and command name (`leapscore-scan`)
- [x] 1.2 Set `action.yml` `description` to `Checkout-first local scan: grades the checked-out working tree, with no clone and no token.` and verify it is under 125 characters and still states the local-only scope
- [x] 1.3 Confirm no input, output, `branding`, or `runs` key changed, so the Action contract is byte-identical apart from the two metadata strings

## 2. Release identity

- [x] 2.1 Bump `apps/scanner/package.json` to `1.0.2` and verify `package-lock.json` records the same version
- [x] 2.2 Rebuild the scanner bundle (`npm run build:cli`) and the Action bundle (`npm run build --workspace leapscore-action`) and verify the committed `dist` files carry the `1.0.2` stamp
- [x] 2.3 Run `npm run check:dist` and verify the rebuilt Action dist is byte-identical to a fresh build and the root metadata still names `action/dist/index.js` with `using: node24`
- [x] 2.4 Run `npm run release:guard -- v1.0.2` and verify the tag and manifest version agree

## 3. Notes and docs

- [x] 3.1 Write `docs/releases/1.0.2.md` stating that scanner, scoring, rubric, report-envelope, CLI, and Action behavior are unchanged, that every `score_fingerprint` moves with the engine stamp, and that no Marketplace-visible version remains below `1.0.2`
- [x] 3.2 Mark the `v1.0.1` listing URL in `docs/releases/1.0.1.md` as superseded by the `1.0.2` listing, so the record does not point at a retired slug as if it were current
- [x] 3.3 Verify `npm run check:documentation-structure` passes with the new release notes file in place

## 4. Cut the release

- [ ] 4.1 Run `npm run release:gates` and verify every `check:*`, bundle parity, and workspace suite passes
- [ ] 4.2 Commit the metadata, identity, notes, and rebuilt bundles, then create annotated tag `v1.0.2` and push the tag
- [ ] 4.3 Verify the workflow's `verify` and `publish` jobs succeed and the registry serves `1.0.2` with provenance
- [ ] 4.4 Verify the `smoke` job seals `engine_version=1.0.2` with a fingerprint that differs from `1.0.1`, and that `finalize` moves `v1` to the release commit

## 5. Marketplace listing

- [ ] 5.1 Set the Marketplace flag on the `v1.0.2` release and verify `https://github.com/marketplace/actions/leapscore-scan` resolves with the new name and description
- [ ] 5.2 If GitHub refuses a second listing for the repository, clear the flag on `v1.0.1` and then set it on `v1.0.2`, and record that the fallback sequence was used
- [ ] 5.3 Clear the Marketplace flag on `v1.0.1` and verify no version below `1.0.2` remains visible on the surviving listing
- [ ] 5.4 Verify `https://github.com/marketplace/actions/leapscore-local-scan` no longer serves a listing, or record its redirect target if it does

## 6. Evidence

- [ ] 6.1 Record the listing URL, the retired slug, the visible-version floor, and the ordering actually used in the release evidence for `1.0.2`
- [ ] 6.2 Update the `release-and-publish` change notes so task 5.7 points at the `1.0.2` listing and the retired `1.0.1` flag instead of leaving the generic listing instruction open
- [ ] 6.3 Verify a consumer pinned to `@v1.0.1` and one pinned to `@v1` still resolve after the retirement, confirming the listing flag is presentation-only
