# tooling

Repo automation: rubric compilation + enforcement checks.

## Scripts

- `scripts/compile-rubric.ts` — canonical `docs/rubric/*.md` → `apps/scanner/src/scan/scoring/rubric.json` + `apps/site/lib/generated/rubric.ts` (indicators, weights, tiers, gates, applicability, remediation playbooks).
  - `npm run compile:rubric` — regenerate (from repo root).
  - `npm run check:rubric-consistency` — `--check` mode: asserts the generated files match the encyclopedia (IDs, names, effort tags, ≤5% missing remediation). **This is the CI gate**, not `checks/rubric-consistency.ts`.

## Checks

| Check | Command | What it enforces |
|-------|---------|------------------|
| Rubric consistency | `npm run check:rubric-consistency` | Generated registry matches encyclopedia; remediation coverage |
| Detector isolation | `npm run check:detector-isolation` | No raw `fetch`/`fs`/`child_process` in detectors (`checks/detector-isolation.ts`, enforced) |
| Schemas | `checks/schemas.ts` | **Stub** — per-indicator schema validation not yet implemented; manifests in `packages/detectors/*/schema.json` are unchecked |
| Rubric-consistency stub | `checks/rubric-consistency.ts` | **Stub** — kept for the AGENTS.md cardinal-rule reference; the real check is `scripts/compile-rubric.ts --check` |

Run both enforced checks from the repo root before merging rubric, detector, or scoring changes.
