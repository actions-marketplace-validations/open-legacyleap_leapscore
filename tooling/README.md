# tooling

Repo automation: rubric compilation + enforcement checks.

## Scripts

- `lib/rubric-catalog.ts` — the one derivation of the category table from the tree (`indicators/<NN-slug>/` order and label, category code from the ID prefix); imported by the compiler and the structure check.
- `scripts/compile-rubric.ts` — canonical `docs/rubric/indicators/<NN-slug>/<ID>-<slug>.md` + `docs/rubric/model/config.md` → `apps/scanner/src/scan/scoring/rubric.json` + `apps/site/lib/generated/rubric.ts` + `docs/rubric/sheets/*` (indicators, weights, tiers, gates, applicability, remediation playbooks).
  - `npm run compile:rubric` — regenerate (from repo root).
  - `npm run check:rubric-consistency` — `--check` mode: validates the canonical catalog (one-to-one IDs, category membership, identity metadata, shared configuration) and asserts the generated files match it (IDs, names, effort tags, ≤5% missing remediation). **This is the CI gate**, not `checks/rubric-consistency.ts`.

## Checks

| Check | Command | What it enforces |
|-------|---------|------------------|
| Rubric consistency | `npm run check:rubric-consistency` | Canonical catalog is one-to-one and complete; generated registry matches it; remediation coverage |
| Documentation structure | `npm run check:documentation-structure` | Unified indicator skeleton, index coverage, local link integrity, cross-document citation resolution, no redirect-only paths, 102-ID coverage |
| Schemas | `npm run check:schemas` | Every detector schema resolves to its unified indicator's §7 fact schema |
| Detector isolation | `npm run check:detector-isolation` | No raw `fetch`/`fs`/`child_process` in detectors (`checks/detector-isolation.ts`, enforced) |
| Bin wiring | `npm run check:bin-wiring` | Documented command invocations resolve to shipped shims |
| Dist freshness | `npm run check:dist` | Committed Action bundle is byte-identical to its sources |
| Rubric-consistency stub | `checks/rubric-consistency.ts` | **Stub** — kept for the AGENTS.md cardinal-rule reference; the real check is `scripts/compile-rubric.ts --check` |

Run all enforced checks from the repo root before merging rubric, detector, or scoring changes.
