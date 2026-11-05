# LeapScore GitHub Action (local-first)

Checkout-first thin wrapper around `leapscore-scan scan <path>`. Scans the checked-out
working tree with local detectors — no internal clone, no token needed for the default
path. The Action is published at a repository ref, so a consumer references the repository
directly (no subdirectory path):

```yaml
permissions:
  contents: read

jobs:
  leapscore:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: open-legacyleap/leapscore@v1
        id: leapscore
        with:
          path: .
          fail_under_band: moderate
          out_dir: leapscore-report
      - name: Publish the badge
        run: |
          # Regenerate in CI; never hand-edit the date. The month on the badge is the
          # scan month, so only a new scan can refresh it.
          git add .github/leapscore-badge.svg
          git diff --cached --quiet || git commit -m "chore: refresh LeapScore badge"
          git push
```

`actions/checkout` must run before the scan: the Action reads the working tree and does not
clone. `fetch-depth: 0` is recommended — a shallow checkout has no history, so
history-derived indicators seal as `unknown` with a re-run hint; the scan still seals.

Pinning: `@v1` is the moving major tag (newest compatible release), `@v1.0.0` is an
immutable release tag, and a commit SHA is the strictest pin. No moving minor tag is
published; use the exact `vX.Y.Z` tag for minor-level stability.

Setting `badge` writes two files: the SVG at that path and a copy-paste embed snippet
beside it (`.github/leapscore-badge.snippet.md`). Paste the snippet's Markdown line into the
README; it wraps the badge in the sealed report permalink and carries the full sentence as
`alt`. The written path is exposed as `steps.leapscore.outputs.badge-path`.

## Inputs

- `path` (default `.`) — local directory to scan.
- `fail_under` (default empty) — `0-100` threshold; the step fails via `core.setFailed`
  with score-vs-threshold messaging when the sealed score is below it. Mutually exclusive
  with `fail_under_band`.
- `fail_under_band` (default empty) — band-native gate (`critical|high|moderate|low`); the
  step fails when the sealed score is below that band's floor. Mutually exclusive with
  `fail_under`.
- `strict` (default `false`) — `'true'` = zero-socket mode.
- `out_dir` (default `leapscore-report`) — receives `report.json` + `report.html` +
  `report.md`.
- `engine_ref` — pinned engine ref for `meta.engineSha7`.
- `baseline` — path to a previously sealed `report.json`; writes `report.delta.json` beside
  the sealed reports.
- `ratchet` — ratchet gate on the code-attributable part of the delta: `'true'` for
  tolerance `0`, or a tolerance in points (e.g. `'2.5'`). Requires `baseline`.
- `badge` (default empty) — path for the score badge SVG; empty writes no badge. The embed
  snippet is written beside it as `<name>.snippet.md`.

Reports are still written and uploaded (`if: always()`), even when a gate trips.

## Outputs / exits

- `exit-code`: `0` pass · `1` crash · `2` usage-or-refused · `3` threshold or ratchet trip.
- `score`, `tier` (when a report was written).
- `badge-path` (when `badge` was set) — the path of the written SVG.

## Runner requirements

The Action declares `using: node24` — the runtime the runner provides, not one the consumer
installs. GitHub-hosted runners support it. A **self-hosted runner** pinned to an older
runner release that only advertises `node20` cannot start this Action: update the runner
before using it. The CLI's own `engines` floor (Node ≥ 20) is independent of the runner
runtime and only applies when the scanner is installed and run directly.

## Development

Build: `node ./scripts/build.mjs` (esbuild → `dist/index.js`, checked in; the scanner bundle
is `dist/leapscore-scan.mjs`). The metadata lives at the repository root (`action.yml`) and
points at `action/dist/index.js`.
Test: `npx tsx --test src/main.test.ts`.
