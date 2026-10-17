# ECOS-03 — Abandoned / Unmaintained Libraries — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (arbitrated; encyc B·estimated, matrix A·measured — see README §4) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-03 |

## 1. Inputs

- **Planes:** ecosystem (vendored package metadata) + static-src (lockfiles, source imports)
- **Tools:** lockfile/manifest parsers; vendored package-metadata table (`last_release` per package; part of the eol snapshot); source-import scan for the `in_core_path` join. The GH-API `archived`/`pushed_at` check is out of scope for the offline release — entries carry `archived: false` (not asserted, never guessed into a Red).
- **Rate-cost:** none (offline; load-bearing = prod direct deps)
- **Ecosystems:** npm · pip · go · Maven · bundler · NuGet (`packages.lock.json` + `packages.config`/`PackageReference` manifests)
- **Applicability:** same as ECOS-02 (no manifests/lockfile → N/A clause-b).

## 2. Detection recipe

1. Parse lockfile/direct surface; select the load-bearing set = prod direct deps (dev-only fallback when no prod scope is declared).
2. Per package: look up `last_release` in the vendored metadata table → `months_since_release`; a package absent from the table is counted `unresolvable` and named in `unresolvable_names` — never guessed.
3. Join `in_core_path` against the parsed source-import graph (JS/TS/Py/Go/Java/Ruby/PHP/Rust + C# `using` / VB `Imports`; source set includes `.vb`).
4. Classify `abandoned = months_since_release > R_months` (thresholds by ID; never restated here).

Preconditions: parsed lockfile (no lockfile → `unknown`, "pin your deps" — abandonment is not knowable per-version from floating specs).

## 3. Fact schema

```json
{"ecos03": {
  "load_bearing_total": 142,
  "abandoned": [{"name": "pdfkit", "version": "1.2.3", "months_since_release": 30, "archived": false, "in_core_path": false}],
  "bus_factor_1_count": 0,
  "unresolvable": 2,
  "unresolvable_names": ["internal-sdk"],
  "resolvable_ratio": 0.986}}
```

## 4. Statusing rules

```yaml
measured_when:  load_bearing_total > 0, resolvable_ratio >= 0.7, and the import scan is not truncated
estimated_when: 0 < resolvable_ratio < 0.7, OR the source-import scan was truncated   # clamp [1,2], confidence low
unknown_when:   no lockfile (floating install -> abandonment unknowable per-version); no load-bearing dependency; or every load-bearing dep unresolvable against the table
na_when:        ECOS-02 applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface); low on partial resolvability / truncation
scope_limited:  partial resolvability or truncated import scan -> estimated + scope-limited
```

## 5. Score mapping (predicates)

- `3`: `abandoned.len == 0`
- `2`: only peripheral abandoned with `12 <= months <= Y_MONTHS` or bus-factor-1 flags (Y/R values: see encyclopedia §ECOS-03)
- `1`: abandoned in isolated/non-critical service path, or recent abandonment (<12mo)
- `0`: `any(abandoned where in_core_path ∧ (archived ∨ months > R_MONTHS))`

## 6. Gate hooks

none (portfolio-level concern stays in-category).

## 7. Failure & budget semantics

- Budget class: `fast`
- Metadata-table misses → `unresolvable` (named); ratio-driven degrade as above
- Truncated/aborted source-import scan → the `in_core_path` join is partial → estimated + scope-limited (import evidence is disclosed)
- No lockfile → `unknown` with emission text (pin your deps first)

## 8. Evidence string

```
evidence: "lockfile-parse+snapshot: {k}/{n} load-bearing deps unmaintained; worst: {name} last release {months}mo"
basis:    "lockfile-parse: only {k}/{n} deps resolvable against the metadata table (low confidence)"
```

## 9. Scope/overlaps echo

Abandoned-lib maintenance risk only; malware/provenance risk is ECOS-10, license posture is ECOS-05.
