# @leapscore/detectors

Per-indicator detector registry — one folder per rubric indicator (102 total: `manifest.json` + `schema.json` each).

## Layout

```
packages/detectors/<short-id>/   e.g. sec-02/
  manifest.json   — id, name, tier, default status, budget class, tools, ecosystems
  schema.json     — fact envelope for the indicator (§3 of its docs/spec)
  detector.ts     — standalone implementation, when one exists (3 today: arch-09, sec-02, sec-03)
```

Short IDs drop the category prefix (`SEC-02` → `sec-02`); the full ID lives in the manifest and in `docs/specs/`.

## Relationship to the engine

The **live** detectors are engine-native (`packages/engine/detectors/*.ts`, 31 indicators) — they run inside the unified scan's `ctx` (`ctx.gh`, `ctx.readFile`). This package is the registry + contract surface: the engine's `registry.ts` discovers manifests/schemas, and `tooling/checks/detector-isolation.ts` enforces the isolation rule (no raw `fetch`/`fs`/`child_process` in detectors).

`detector.ts` files here are the exception, not the rule — added only where a standalone implementation is cleaner than an engine-native module. New detectors: add the folder (manifest + schema per `docs/specs/<ID>` §1/§3), wire into `packages/engine/detectors/`, cover with `packages/engine/__tests__/detector.contract.test.ts`.

## Conventions

- Fact fields: indicator-namespaced, snake_case, units embedded (`days_until_eol`).
- Evidence grammar: `evidence:` = `<tool>: <key-fact> (<path-or-endpoint>)`; `basis:` for estimated rows — exactly one per row.
- Statusing/budget semantics come from the indicator's `docs/specs/` file (§4/§7), not from the manifest.
