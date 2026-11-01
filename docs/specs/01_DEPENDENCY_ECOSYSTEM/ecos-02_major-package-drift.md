# ECOS-02 — Major Package Drift — Implementation Spec

> **Authority:** This file defines the ECOS-02 implementation contract. The [ECOS rubric category](../../rubric/01_DEPENDENCY_ECOSYSTEM.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

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

- **Planes:** ecosystem (vendored package metadata) + static-src (manifests/lockfiles)
- **Tools:** manifest/lockfile parsers; vendored package-metadata table (registry-derived `latest_major` / `last_release`, shipped as part of the eol snapshot; refresh via `tooling/scripts/refresh-snapshots.ts`). No repo-side execution — the offline table compare replaces `npm outdated`/`pip list --outdated`.
- **Rate-cost:** none (offline; direct deps only)
- **Ecosystems:** npm/yarn/pnpm · pip/poetry/uv · go modules · Maven/Gradle · bundler · NuGet (`packages.config`, `PackageReference` in `.csproj`/`.vbproj`, `packages.lock.json`)
- **Applicability:** `na_when: zero dependency manifests AND zero lockfiles parse in an enumerated tree` (clause-b). Else applicable.

## 2. Detection recipe

1. Parse direct deps from manifests (`dependencies` vs `devDependencies` recorded; scoring uses prod scope).
2. Per dep: look up the latest major in the vendored metadata table; derive `current_major` per ecosystem convention (ambiguous parses → `version_parse_confident: false`, excluded). A version ahead of the table counts resolvable and is not drift.
3. Compute `majors_behind = latest_major − current_major`.
4. Classify `core_framework` via the per-ecosystem framework allowlist vs `library` (legacy-stacks adds the .NET family — `Microsoft.AspNet.*` by prefix, `EntityFramework`, `Microsoft.EntityFrameworkCore` — and `org.apache.struts:struts2-core`).
5. Private-registry/git-URL deps, and packages absent from the metadata table → counted `unresolvable`, excluded from percentages, and named in `unresolvable_names`.

Preconditions: ≥1 parseable manifest.

## 3. Fact schema

```json
{"ecos02": {
  "direct_deps_total": 87, "unresolvable": 3,
  "unresolvable_names": ["internal-billing-client"],
  "resolvable_ratio": 0.97,
  "pct_behind_1plus_major": 34.5, "pct_behind_2plus_major": 12.6,
  "core_framework_gaps": [{"name": "django", "current": "3.2", "latest_major": 5, "majors_behind": 2}]}}
```

## 4. Statusing rules

```yaml
measured_when:  direct_deps_total > 0 and resolvable_ratio >= 0.8   # resolvable = parseable major + table metadata present
estimated_when: 0 < resolvable_ratio < 0.8      # clamp [1,2], confidence low
unknown_when:   manifests exist but nothing resolvable (fully private ecosystem, or the whole surface is absent from the table)
na_when:        clause-b fired
clamp:          [1,2]
confidence:     medium (exhaustive manifest surface + pinned metadata table)
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
- A dep absent from the vendored table (or with an unparseable version) → `unresolvable`, named in `unresolvable_names`; the ratio rules decide degrade (no guessed majors)
- Offline snapshot → no rate-limit failure mode

## 8. Evidence string

```
evidence: "lockfile-parse: {pct}% of {n} direct deps >=1 major behind; core gaps: {gap_list}"
basis:    "lockfile-parse: only {k}/{n} resolvable ({ratio}); drift percentages low-confidence"
```

## 9. Scope/overlaps echo

Single-repo major-version drift; per-service skew is ECOS-09, runtime EOL is ECOS-01.
