# LeapScore GitHub Action (local-first)

Checkout-first thin wrapper around `leapscore-scan scan <path>`. Scans the
checked-out working tree with local detectors — no internal clone, no token
needed for the default path.

```yaml
- uses: actions/checkout@v5
- uses: ./action
  id: leapscore
  with:
    path: .
    fail_under: "53"
    strict: "false"
    out_dir: leapscore-report
    badge: .github/leapscore-badge.svg
- name: Publish the badge
  run: |
    # Regenerate in CI; never hand-edit the date. The month on the badge is the
    # scan month, so only a new scan can refresh it.
    git add .github/leapscore-badge.svg
    git diff --cached --quiet || git commit -m "chore: refresh LeapScore badge"
    git push
```

Setting `badge` writes two files: the SVG at that path and a copy-paste
embed snippet beside it (`.github/leapscore-badge.snippet.md`). Paste the
snippet's Markdown line into the README; it wraps the badge in the sealed
report permalink and carries the full sentence as `alt`. The written path is
exposed as `steps.leapscore.outputs.badge-path`.

## Inputs

- `path` (default `.`) — local directory to scan.
- `fail_under` (default empty) — `0-100` threshold; the step fails via
  `core.setFailed` with score-vs-threshold messaging when the sealed score is
  below it. Reports are still written and uploaded (`if: always()`).
- `strict` (default `false`) — `'true'` = zero-socket mode.
- `out_dir` (default `leapscore-report`) — receives `report.json` +
  `report.html` + `report.md`.
- `engine_ref` — pinned engine ref for `meta.engineSha7`.
- `badge` (default empty) — path for the score badge SVG; empty writes no
  badge. The embed snippet is written beside it as `<name>.snippet.md`.

## Outputs / exits

- `exit-code`: `0` pass · `1` crash · `2` usage-or-refused · `3` threshold trip.
- `score`, `tier` (when a report was written).
- `badge-path` (when `badge` was set) — the path of the written SVG.

Build: `node ./scripts/build.mjs` (esbuild → `dist/index.js`, checked in).
Test: `npx tsx --test src/main.test.ts`.
