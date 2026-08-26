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

- **Planes:** ecosystem (registry + repo metadata), static-src (lockfiles)
- **Tools:** npm registry / PyPI JSON / RubyGems / Maven Central metadata (last-release time, deprecated flag, archived repo link); GitHub API `GET /repos/{owner}/{repo}` (`archived`, `pushed_at`). Socket.dev optional enrichment, not required for status.
- **Rate-cost:** api-budgeted (load-bearing deps only: prod direct deps + their first-order transitive closure capped at 300)
- **Ecosystems:** npm · pip · go · Maven · bundler
- **Applicability:** same as ECOS-02 (no manifests/lockfile → N/A clause-b).

## 2. Detection recipe

1. Resolve lockfile graph; select load-bearing set (prod direct + transitive closure, cap 300 by fan-in rank).
2. Per package: fetch registry metadata → `last_release_ts`, `deprecated_flag`, `repo_url`.
3. For mapped repos: GH API `archived`, `pushed_at`.
4. Compute `months_since_release`; classify `abandoned = months_since_release > R_months ∨ archived ∨ revoked`.
5. Distinguish mature-stable (slow but alive: any release/tag activity within window) per criteria.

Preconditions: parsed lockfile.

## 3. Fact schema

```json
{"ecos03": {
  "load_bearing_total": 142,
  "abandoned": [{"name": "pdfkit", "months_since_release": 30, "archived": true, "in_core_path": false}],
  "bus_factor_1_count": 4,
  "unresolvable": 2}}
```

## 4. Statusing rules

```yaml
measured_when:  load_bearing_total > 0 and resolvable_ratio >= 0.7
estimated_when: 0 < resolvable_ratio < 0.7            # clamp [1,2], confidence low
unknown_when:   no lockfile (floating install -> abandonment unknowable per-version)
na_when:        ECOS-02 applicability fired
clamp:          [1,2]
confidence:     medium (exhaustive lockfile surface); low if transitive closure truncated
scope_limited:  cap-truncated closure -> estimated + scope-limited
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
- Registry/GH metadata failures → `unresolvable`; ratio-driven degrade as above
- No lockfile → `unknown` with emission text (pin your deps first)

## 8. Evidence string

```
evidence: "registry+gh-api: {k}/{n} load-bearing deps unmaintained; worst: {name} archived={bool}, last release {months}mo"
```

## 9. Scope/overlaps echo

Abandoned-lib maintenance risk only; malware/provenance risk is ECOS-10, license posture is ECOS-05.
