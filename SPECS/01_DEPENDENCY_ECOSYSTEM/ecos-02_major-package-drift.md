# ECOS-02 — Major Package Drift — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (arbitrated; encyc said estimated — see README §4) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min |
| Thresholds & 0–3 criteria | see encyclopedia §ECOS-02 |

## 1. Inputs

- **Planes:** ecosystem (registry metadata) + static-src (manifests)
- **Tools:** registry REST APIs (npm, PyPI JSON, RubyGems, Maven Central, crates.io); manifest parsers. No repo-side execution — registry compares replace `npm outdated`/`pip list --outdated`.
- **Rate-cost:** api-budgeted (direct deps only; cap 200 lookups/scan)
- **Ecosystems:** npm/yarn/pnpm · pip/poetry/uv · go modules · Maven/Gradle · bundler
- **Applicability:** `na_when: zero dependency manifests AND zero lockfiles parse in an enumerated tree` (clause-b). Else applicable.

## 2. Detection recipe

1. Parse direct deps from manifests (`dependencies` vs `devDependencies` recorded; scoring uses prod scope).
2. Per dep: fetch latest version from registry; derive `major` per ecosystem convention (ambiguous parses → `version_parse_confident: false`, excluded).
3. Compute `majors_behind = latest_major − current_major`.
4. Classify `core_framework` via per-ecosystem framework allowlist vs `library`.
5. Private-registry/git-URL deps → counted `unresolvable`, excluded from percentages.

Preconditions: ≥1 parseable manifest.

## 3. Fact schema

```json
{"ecos02": {
  "direct_deps_total": 87, "unresolvable": 3,
  "pct_behind_1plus_major": 34.5, "pct_behind_2plus_major": 12.6,
  "core_framework_gaps": [{"name": "django", "current": "3.2", "latest_major": 5, "majors_behind": 2}]}}
```

## 4. Statusing rules

```yaml
measured_when:  direct_deps_total > 0 and resolvable_ratio >= 0.8
estimated_when: 0 < resolvable_ratio < 0.8      # clamp [1,2], confidence low
unknown_when:   manifests exist but nothing resolvable (fully private ecosystem)
na_when:        clause-b fired
clamp:          [1,2]
confidence:     medium (exhaustive manifest surface + authoritative registries)
scope_limited:  unresolvable > 20% -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values: see encyclopedia §ECOS-02.

- `3`: `pct_behind_1plus < Y1` ∧ `max(core_framework_gaps.majors_behind) <= 1`
- `2`: Yellow-band composition (`Y1 <= pct_behind_1plus < R1`)
- `1`: `max(core_framework_gaps.majors_behind) == 2` ∨ Red-band composition without core-framework stuck state
- `0`: `max(core_framework_gaps.majors_behind) >= 3`

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Registry timeout/4xx per dep → that dep `unresolvable`; ratio rules decide degrade
- Rate-limit exhausted mid-scan → `estimated` + `scope-limited` with resolved-count noted

## 8. Evidence string

```
evidence: "registry-compare: {pct}% of {n} direct deps >=1 major behind; core gaps: {gap_list}"
basis:    "registry-compare: only {k}/{n} resolvable ({ratio}); drift percentages low-confidence"
```

## 9. Scope/overlaps echo

Single-repo major-version drift; per-service skew is ECOS-09, runtime EOL is ECOS-01.
