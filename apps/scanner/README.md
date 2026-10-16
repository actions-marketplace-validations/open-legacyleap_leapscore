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
