# LeapScore GitHub Action (local-first)

Checkout-first thin wrapper around `leapscore-scan scan <path>`. Scans the
checked-out working tree with local detectors — no internal clone, no token
needed for the default path.

```yaml
- uses: actions/checkout@v5
- uses: ./action
  with:
    path: .
    fail_under: "53"
    strict: "false"
    out_dir: leapscore-report
```

## Inputs

- `path` (default `.`) — local directory to scan.
- `fail_under` (default empty) — `0-100` threshold; the step fails via
  `core.setFailed` with score-vs-threshold messaging when the sealed score is
  below it. Reports are still written and uploaded (`if: always()`).
- `strict` (default `false`) — `'true'` = zero-socket mode.
- `out_dir` (default `leapscore-report`) — receives `report.json` +
  `report.html` + `report.md`.
- `engine_ref` — pinned engine ref for `meta.engineSha7`.

## Outputs / exits

- `exit-code`: `0` pass · `1` crash · `2` usage-or-refused · `3` threshold trip.
- `score`, `tier` (when a report was written).

Build: `node ./scripts/build.mjs` (esbuild → `dist/index.js`, checked in).
Test: `npx tsx --test src/main.test.ts`.
