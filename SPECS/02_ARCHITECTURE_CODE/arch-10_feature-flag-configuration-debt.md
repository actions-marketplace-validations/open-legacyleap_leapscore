# ARCH-10 — Feature-Flag & Configuration Debt — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **estimated** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | ⚡ human · engine: grep sweep + blame |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-10 |

## 1. Inputs

- **Planes:** static-src + git
- **Tools:** AST-grep matchers: hardcoded toggles (`const X = true`, `if FLAG:` literals), env-config baked as literals in source vs `.env.example`/config templates; flag-manager SDK presence (`launchdarkly`, `unleash`, `flagsmith`, `growthbook` deps); `git log --follow` flag age
- **Rate-cost:** none
- **Ecosystems:** agnostic matchers
- **Applicability:** never N/A for scored repos (absence of flags/config hygiene is itself signal).

## 2. Detection recipe

1. Toggle sweep over non-test source: boolean/string constants used in conditionals with literal initializers.
2. Flag age per site: introduction commit date via blame; owner inference from CODEOWNERS proximity.
3. Prod-config-in-repo scan: files matching prod-config patterns (`*.production.*`, deploy manifests with inline secrets-shaped values — values not read, only flagged; secrets themselves are SEC-02).
4. Externalized-config posture: env templates present ∧ CI/deploy injects config (deploy job env refs) vs hand-edited per-env files committed.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"arch10": {
  "hardcoded_toggles": [{"name": "checkoutV2", "file": "src/config.ts", "age_days": 420}],
  "toggles_in_core": 2,
  "flag_sdk_present": false,
  "prod_config_in_repo": true,
  "env_templates_present": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # toggle-vs-config classification is inferential
estimated_when: >=1 sweep completed            # clamp [1,2]; confidence medium iff blame ages complete
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium when toggle+config+age probes all ran
scope_limited:  sampled dirs -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §ARCH-10. Estimated ⇒ score ∈ {1,2}:

- `2`: toggles only outside core ∧ some owned/aged flags ∨ partial templating
- `1`: `toggles_in_core > 0` ∧ no retirement evidence ∨ `prod_config_in_repo`
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Blame unavailable (shallow history) → drop age facts → confidence low

## 8. Evidence string

```
basis: "flag-sweep: {n} hardcoded toggles ({k} core, oldest {d}d); prod-config-in-repo={bool}; sdk={bool}"
```

## 9. Scope/overlaps echo

Config/flag mechanics only; secrets are SEC-02, env drift is VEL-07/DATA-10, dead stuck-on flags are ARCH-04.
