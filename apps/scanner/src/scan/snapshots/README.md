# Vendored offline datasets

These files are the reference data an offline scan needs, compiled from the
curated source in `tooling/scripts/snapshot-data.ts`.

- `eol.json` (`eol-snapshot`) — runtime/language end-of-life cycles, framework
  support status, and a small package metadata table (`latest_major`,
  `last_release`, `license`) used by ECOS-01/02/03/05/08.
- `advisories.json` (`advisory-snapshot`) — a pinned advisory subset (GHSA/CVE)
  scoped to the ecosystems the manifest sniffer parses, used by SEC-01.

Every dataset carries a `version` id (content hash). The version ids join
`report.provenance.snapshot_versions` and the score fingerprint, so a refresh is
a deliberate, visible score input.

## Refresh (never hand-edit these files)

```bash
# 1. edit tooling/scripts/snapshot-data.ts
# 2. rebuild the JSON with a fresh content-hash version id
npx tsx tooling/scripts/refresh-snapshots.ts
# 3. commit the regenerated files
```

`--now <ISO>` pins `generated_at`; the version id is a hash of the data payload,
so `generated_at` never affects the fingerprint.

## Absent data is never guessed

A lookup miss returns `null`/`[]`. Detectors MUST then report the row `unknown`
with a what-it-takes note (the snapshot refresh hint in `snapshots.ts`) — never a
permissive default such as "in support" or "clean".
