# @leapscore/scanner

Local-first legacy/maintainability scanner. Default entry scans a local directory —
no clone, no GH-API:

```sh
leapscore-scan scan ./claims-core --out ./out
leapscore-scan scan ./app --strict --out ./out
leapscore-scan --repo vercel/next.js --out ./out
```

`--out <dir>` always receives all three files: `report.json` (machine),
`report.html` (self-contained, no external assets), `report.md` (pasteable).
Stdout prints one line: score/band, gates, coverage, threshold state, plus the
tracked assessment URL once.

Exits: `0` pass · `1` crash · `2` usage-or-refused · `3` threshold trip
(`--fail-under <0-100>`, evaluated after seal; files are still written).

`--strict` is zero-socket mode (vendored snapshots only; any network attempt
aborts) and conflicts with `--repo` (exit 2, before any work).

## Entry point

`leapscore-scan` is the built release artifact — `apps/scanner/dist/leapscore-scan.mjs`, a
single readable ESM bundle with zero runtime dependencies (JSON assets inlined; `git` is
the only binary it spawns). It runs on stock Node ≥ 20; nothing else. The build is
`npm run build:cli` at the repo root, and the root `prepare` script runs it on every
`npm install`. Both install topologies point at the built file, and both must stay wired:

- **Workspace install (local authority):** `apps/scanner/package.json` declares
  `"bin": { "leapscore-scan": "./dist/leapscore-scan.mjs" }`. A `npm install` at the repo root
  builds the bundle (root `prepare`) and links `node_modules/.bin/leapscore-scan`, so the
  command runs from any npm context — `npm run`, `npm exec`, Action scripts. Invoke it as
  `leapscore-scan …`; do not fall back to `npx tsx apps/scanner/bin/scan.ts` (that form
  bypasses the wiring and hides a broken shim).
- **Git install (`npx -p "<repo>#<ref>" leapscore-scan`):** a git install of this repo
  installs only the root package, so the root `package.json` `bin` block must keep the
  same `leapscore-scan` → `apps/scanner/dist/leapscore-scan.mjs` mapping. This is the form
  `.github/workflows` and `docs/plans/14_WORKFLOW_SCAN_V1.md` use.

The workspace `bin` is the local authority: the shim is generated from it, and any
rename must move it there. `npm run check:bin-wiring` at the repo root enforces both
sides — declaration parity across topologies and a resolving, executable shim.

## Score badge

`--badge <path>` writes a self-contained score badge SVG beside the report trio,
plus a copy-paste embed snippet at `<name>.snippet.md`:

```sh
leapscore-scan scan ./claims-core --strict --out ./out --badge ./docs/leapscore-badge.svg
```

The badge states four facts — band, score, coverage, and the scan month — and is
a derived view of the sealed envelope: it never changes `report.json`,
`report.html`, `report.md`, or `score_fingerprint`. Its coverage is the same
`(measured + estimated) / (measured + estimated + unknown)` quantity that gates
headline suppression, so a printed score and a printed coverage cannot
contradict each other. Fixtures (`report.sample`) and delta documents are
refused (exit 2) rather than emitting a badge with nothing real to cite.

**Regenerate in CI; never hand-edit the date.** The month is the *scan* month,
not the generation date, so re-rendering an old report keeps the old month. The
only way to refresh a badge is to run a new scan — a badge that says `2026-10`
in 2028 is correctly saying the scan is old.

The snippet carries both forms. Markdown:

```
[![LeapScore badge: score 62, band Moderate, 65% gradeable, measured October 2026.](docs/leapscore-badge.svg)](https://leapscore.dev/reports/acme__api__a3f9c1__20261031T091200Z)
```

HTML:

```html
<a href="https://leapscore.dev/reports/acme__api__a3f9c1__20261031T091200Z"><img src="docs/leapscore-badge.svg" alt="LeapScore badge: score 62, band Moderate, 65% gradeable, measured October 2026."></a>
```

The link is a provenance citation to the sealed report, so it carries no
assessment campaign parameters. The `alt` is the full sentence, not "badge".

## Generic CI (any pipeline, not just GitHub Actions)

The bundle is the portable unit: copy `leapscore-scan.mjs` (or the container image) into
any pipeline that can run `node ≥ 20`, or run the container:

```sh
# direct — one file, zero install beyond node
node leapscore-scan.mjs scan ./repo --out ./leapscore-report --strict --fail-under 53

# container — same artifact, same seal (verified byte-parity of score/band/fingerprint)
docker run --rm -v "$PWD/repo:/work/repo:ro" -v "$PWD/out:/work/out" leapscore-scan \
  scan /work/repo --out /work/out --strict
```

Exit-code contract (stable across CLI, Action, and container):

| exit | meaning | CI handling |
| ---- | ------- | ----------- |
| `0` | scan sealed, no gate tripped | pass |
| `1` | scanner crash | fail loudly; artifacts may be absent |
| `2` | usage error or refusal (bad path, `--strict`+`--repo`, incomparable ratchet, unreadable `LEAPSCORE_CLI`) | fail the invocation, not the repo |
| `3` | threshold trip (`--fail-under <0-100>` or `--fail-under-band critical|high|moderate|low`) | fail; the three report files are still written |

Gates run **after seal**, so a tripped gate still produces the full report trio —
archive the `--out` directory on every outcome (`if: always()` / `when: always()`),
that artifact is the evidence either way.

## Network posture

Two postures, no surprises:

- **Default local scan** may make allowlisted open-internet `GET` requests only:
  `registry.npmjs.org`, `pypi.org`, `proxy.golang.org`,
  `repo.maven.apache.org`, `packagist.org`, `crates.io`, `endoflife.date`,
  `osv.dev` (registry lookups, runtime-EOL tables, vuln DB).
- **`--strict`** opens zero sockets: detectors use vendored EOL/vuln snapshots
  and emit `unknown` with a re-run hint where live data would be needed. Any
  network attempt aborts the scan instead of degrading silently.

**Never-send rule:** code, file paths, and repository names never leave the
machine. Allowlisted hosts receive only registry/package identifiers and
version strings via `GET` — never source, paths, or repo names.

The only telemetry is the click on the tracked assessment URL
(`utm_campaign=cli-scan-v1&band=<band>`) printed once on stdout and rendered in
HTML/Markdown.
