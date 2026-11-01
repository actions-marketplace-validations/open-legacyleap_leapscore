# ECOS-02 — Major Package Drift

> **Category:** [Dependency & Ecosystem Health](../../01_DEPENDENCY_ECOSYSTEM.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)

## 1. Identity

| field | value |
|---|---|
| ID | ECOS-02 |
| Name | Major Package Drift |
| Category | ECOS — Dependency & Ecosystem Health |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ECOS category % |
| Verify effort | ⚡ ≤ 30 min — one outdated-scan command + PR dashboard glance. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A large fraction of direct dependencies sit one or more *major* versions behind current, or the core framework (Spring, Laravel, Rails, Angular, React, Django) is pinned to an old major.
- **Why it signals obsolescence:** Major versions carry breaking changes that require migration work. Drift compounds: the further behind you are, the more migration steps you must chain, and each one gets harder because intermediate versions are forgotten. Drift also forecloses options — security fixes often land only in new majors.
- **Where it manifests:** `package.json`, `requirements.txt`/`pyproject.toml`, `Gemfile`, `go.mod`, `Cargo.toml`, `pom.xml`/`build.gradle`, lockfiles; tool reports from `npm outdated`, `pip list --outdated`, `dependabot`/`renovate` PR history.
- **Objective metric:** `% of direct deps ≥ 1 major behind`; `% ≥ 2 majors behind`; `core framework major gap`.
- **Yellow flag (warning):** > 30% of direct deps are 1–2 majors behind. *(Rationale: a third of the surface is drift — still manageable, but the migration debt is real.)*
- **Red flag (critical):** > 50% of direct deps ≥ 2 majors behind, or the core framework is more than one major behind current with no upgrade project. *(Rationale: at this depth, individual upgrades stop being safe and the whole dependency graph becomes a migration project.)*
- **Example symptom:** "Renovate opens 40 PRs. Twenty are majors. We merge the patches, close the majors 'for later,' and the pile grows quarterly. Then a CVE needs a fix that only exists in v5, and we're two majors away with no path tested."
- **Blast radius:** Security patches, performance wins, hiring, framework skill availability, ability to onboard AI tooling, compliance reviews, interop with new libraries.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = minor drift only; 2 = 30–50% one major behind; 1 = core framework behind by 2 majors or > 50% drifting; 0 = core framework stuck ≥ 2 majors with no plan.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: enable Dependabot/Renovate with major-update grouping and a monthly budget. Structural fix: "upgrade train" — pick one major hop per quarter, keep intermediate commits shippable, use the dependency graph from tools to sequence hops (don't skip majors). Establish a "never more than 1 major behind" policy for core deps.
- **Gold standard / target state:** Core framework within 1 major of current; < 30% of direct deps behind by a major; automatic update PRs flowing weekly; majors scheduled explicitly on the roadmap.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** ecosystem (vendored package metadata) + static-src (manifests/lockfiles)
- **Tools:** manifest/lockfile parsers; vendored package-metadata table (registry-derived `latest_major` / `last_release`, shipped as part of the eol snapshot; refresh via `tooling/scripts/refresh-snapshots.ts`). No repo-side execution — the offline table compare replaces `npm outdated`/`pip list --outdated`.
- **Rate-cost:** none (offline; direct deps only)
- **Ecosystems:** npm/yarn/pnpm · pip/poetry/uv · go modules · Maven/Gradle · bundler · NuGet (`packages.config`, `PackageReference` in `.csproj`/`.vbproj`, `packages.lock.json`)
- **Applicability:** `na_when: zero dependency manifests AND zero lockfiles parse in an enumerated tree` (clause-b). Else applicable.

## 6. Detection recipe

- **Detection method:** Dependency tree tools — `npm outdated`, `pip list --outdated`, `bundle outdated`, `go list -u -m all`, `cargo outdated`; or a Dependabot/Renovate dashboard showing how many dependency PRs have been open/ignored. Count direct deps where `major version < latest major` and `latest major - current major >= 1`. Classify by whether the drift is in core (framework, ORM, auth) or peripheral (logging, util).

1. Parse direct deps from manifests (`dependencies` vs `devDependencies` recorded; scoring uses prod scope).
2. Per dep: look up the latest major in the vendored metadata table; derive `current_major` per ecosystem convention (ambiguous parses → `version_parse_confident: false`, excluded). A version ahead of the table counts resolvable and is not drift.
3. Compute `majors_behind = latest_major − current_major`.
4. Classify `core_framework` via the per-ecosystem framework allowlist vs `library` (legacy-stacks adds the .NET family — `Microsoft.AspNet.*` by prefix, `EntityFramework`, `Microsoft.EntityFrameworkCore` — and `org.apache.struts:struts2-core`).
5. Private-registry/git-URL deps, and packages absent from the metadata table → counted `unresolvable`, excluded from percentages, and named in `unresolvable_names`.

Preconditions: ≥1 parseable manifest.

## 7. Fact schema

```json
{"ecos02": {
  "direct_deps_total": 87, "unresolvable": 3,
  "unresolvable_names": ["internal-billing-client"],
  "resolvable_ratio": 0.97,
  "pct_behind_1plus_major": 34.5, "pct_behind_2plus_major": 12.6,
  "core_framework_gaps": [{"name": "django", "current": "3.2", "latest_major": 5, "majors_behind": 2}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  direct_deps_total > 0 and resolvable_ratio >= 0.8   # resolvable = parseable major + table metadata present
estimated_when: 0 < resolvable_ratio < 0.8      # clamp [1,2], confidence low
unknown_when:   manifests exist but nothing resolvable (fully private ecosystem, or the whole surface is absent from the table)
na_when:        clause-b fired
clamp:          [1,2]
confidence:     medium (exhaustive manifest surface + pinned metadata table)
scope_limited:  unresolvable > 20% -> estimated + scope-limited
```

### Score mapping predicates

Y/R values: see §3.

- `3`: `pct_behind_1plus < Y1` ∧ `max(core_framework_gaps.majors_behind) <= 1`
- `2`: Yellow-band composition (`Y1 <= pct_behind_1plus < R1`)
- `1`: `max(core_framework_gaps.majors_behind) == 2` ∨ Red-band composition without core-framework stuck state
- `0`: `max(core_framework_gaps.majors_behind) >= 3`

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- A dep absent from the vendored table (or with an unparseable version) → `unresolvable`, named in `unresolvable_names`; the ratio rules decide degrade (no guessed majors)
- Offline snapshot → no rate-limit failure mode

## 10. Evidence and output

### Evidence string

```
evidence: "lockfile-parse: {pct}% of {n} direct deps >=1 major behind; core gaps: {gap_list}"
basis:    "lockfile-parse: only {k}/{n} resolvable ({ratio}); drift percentages low-confidence"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Single-repo major-version drift; per-service skew is ECOS-09, runtime EOL is ECOS-01.
