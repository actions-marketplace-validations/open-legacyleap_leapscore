# ARCH-10 — Feature-Flag & Configuration Debt

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for ARCH-10. Edit this file; the legacy path [arch-10_feature-flag-configuration-debt.md](../../../specs/02_ARCHITECTURE_CODE/arch-10_feature-flag-configuration-debt.md) is a compatibility alias.
> **Category:** [Architecture & Code Quality](../../02_ARCHITECTURE_CODE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/02_ARCHITECTURE_CODE/ARCH-10_feature-flag-configuration-debt.md`

## 1. Identity

| field | value |
|---|---|
| ID | ARCH-10 |
| Name | Feature-Flag & Configuration Debt |
| Category | ARCH — Architecture & Code Quality |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | ⚡ ≤ 30 min — grep sweep + flag inventory. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Configuration and feature toggles are hardcoded in source, live in per-env hand-edited files, or exist as long-lived flags with no owner or retirement — so "safe incremental release" is achieved, if at all, by editing code.
- **Why it signals obsolescence:** Progressive delivery — flags, externalized config, rollback-by-toggle — is the mechanism that makes modernization *safe*. A codebase that hardcodes toggles and buries config in code predates 12-factor discipline: every release is a big-bang, every rollback is a code change, and every environment is a fabrication by hand.
- **Where it manifests:** Hardcoded booleans/strings as toggles (`USE_NEW_FLOW = true` in source), flag values stuck on for months/years with no ticket, prod config values committed to the repo, per-env config files maintained separately by hand, feature branches used as flags (ties to VEL-10), no config management/injection.
- **Objective metric:** `# of hardcoded toggles/flags`; `# of flags on > 6 months with no owner`; `% of env config declared (templated/injected) vs. hand-edited`; `prod config values in repo? (bool)`; `rollback = code change? (bool)`.
- **Yellow flag (warning):** Flags/config hardcoded in non-core modules; some long-lived flags without owners; env config partially hand-edited. *(Rationale: friction and drift risk, modernizable in place.)*
- **Red flag (critical):** Core logic driven by hardcoded toggles/baked config; prod config stored in the repo; flags used as emergency switches with no retirement path. *(Rationale: safe incremental modernization — and safe rollback — is impossible without the flag/config levers.)*
- **Example symptom:** "The new checkout path is behind `const checkoutV2 = true` in `config.ts`, committed 14 months ago 'for the rollout' — the rollout never finished, so the old path is dead code (ARCH-04) and the toggle has no owner. A config fix requires a deploy; a rollback requires another deploy."
- **Blast radius:** Incremental delivery safety, rollback speed, config security, environment drift (VEL-07/DATA-10), release risk (VEL-03).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = all toggles externalized + owned, config injected per env; 2 = toggles in non-core, some uneowned flags; 1 = toggles in core with no ownership, config hand-edited; 0 = core on hardcoded config/flags with no retirement — safe modernization blocked.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: move the top flags to an externalized flag source with owners + retirement dates, externalize prod config into a per-env injected pipeline. Structural fix: config-as-code injected per environment, a flag lifecycle policy (owner, TTL, removal ceremony), a rule that prod values never live in the repo.
- **Gold standard / target state:** Zero hardcoded toggles in core; every flag owned with a retirement date; config injected per env from one source; rollback = flag flip, not code change.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + git
- **Tools:** AST-grep matchers: hardcoded toggles (`const X = true`, `if FLAG:` literals), env-config baked as literals in source vs `.env.example`/config templates; flag-manager SDK presence (`launchdarkly`, `unleash`, `flagsmith`, `growthbook` deps); `git log --follow` flag age
- **Rate-cost:** none
- **Ecosystems:** agnostic matchers
- **Applicability:** never N/A for scored repos (absence of flags/config hygiene is itself signal).

## 6. Detection recipe

- **Detection method:** Grep sweep for toggle/flag/env strings; config-declaration inventory (env templates vs. baked values in source); flag age + ownership via git history; prod-value-in-repo check; env config drift comparison. Count flags, classify by core path.

1. Toggle sweep over non-test source: boolean/string constants used in conditionals with literal initializers.
2. Flag age per site: introduction commit date via blame; owner inference from CODEOWNERS proximity.
3. Prod-config-in-repo scan: files matching prod-config patterns (`*.production.*`, deploy manifests with inline secrets-shaped values — values not read, only flagged; secrets themselves are SEC-02).
4. Externalized-config posture: env templates present ∧ CI/deploy injects config (deploy job env refs) vs hand-edited per-env files committed.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"arch10": {
  "hardcoded_toggles": [{"name": "checkoutV2", "file": "src/config.ts", "age_days": 420}],
  "toggles_in_core": 2,
  "flag_sdk_present": false,
  "prod_config_in_repo": true,
  "env_templates_present": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # toggle-vs-config classification is inferential
estimated_when: >=1 sweep completed            # clamp [1,2]; confidence medium iff blame ages complete
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium when toggle+config+age probes all ran
scope_limited:  sampled dirs -> estimated + scope-limited
```

### Score mapping predicates

Criteria: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: toggles only outside core ∧ some owned/aged flags ∨ partial templating
- `1`: `toggles_in_core > 0` ∧ no retirement evidence ∨ `prod_config_in_repo`
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Blame unavailable (shallow history) → drop age facts → confidence low

## 10. Evidence and output

### Evidence string

```
basis: "flag-sweep: {n} hardcoded toggles ({k} core, oldest {d}d); prod-config-in-repo={bool}; sdk={bool}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Config/flag mechanics only; secrets are SEC-02, env drift is VEL-07/DATA-10, dead stuck-on flags are ARCH-04.
