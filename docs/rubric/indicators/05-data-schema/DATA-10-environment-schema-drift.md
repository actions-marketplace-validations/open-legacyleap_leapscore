# DATA-10 — Environment Schema Drift

> **Category:** [Data & Schema Evolution](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DATA-10 |
| Name | Environment Schema Drift |
| Category | DATA — Data & Schema Evolution |
| Engine tier | A |
| Default status | measured |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔷 ~1–2 days — diff runs + fresh-build measurement. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Dev/test/staging/prod schemas have drifted from each other and from the migration baseline — fixtures that no longer match, environments built by hand, migrations applied differently per environment, and "works in test, breaks in prod" as a normal condition.
- **Why it signals obsolescence:** Drift means the environments are not the same product — every deployment is a gamble on the gap between what was tested and what exists. It invalidates the entire QA pipeline and is usually the companion of DATA-01's migration disorder at the environment level.
- **Where it manifests:** Staging misses 12 tables that prod has; dev DBs differ per engineer; test fixtures fail after migrations; "the bug only reproduces on prod," schema comparison tools run manually; env-specific migrations; rotation/persist scripts per env.
- **Objective metric:** `schema diff count dev→staging, staging→prod`; `fresh-env build time vs. prod`; `# of env-specific hotfix migrations`; `fixture/migration mismatch count`; `test failures only-at-prod rate`.
- **Yellow flag (warning):** Small diffs between environments, mostly non-critical columns; fresh env build mostly works. *(Rationale: warning — the crack exists, prod-only bugs are appearing.)*
- **Red flag (critical):** Meaningful schema drift between all environments, or fresh envs can't be built from migrations, or "prod-only bug" is a standing category. *(Rationale: test results don't transfer to prod — the QA function is invalid.)*
- **Example symptom:** "QA approves a release because staging is green. In prod the new column exists but with a different type; the migration silently failed six months ago. 'Works on staging, breaks in prod' is a known meme."
- **Blast radius:** Release safety, QA validity, debugging time, migration trust, onboarding (broken local DBs), incident frequency.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = zero drift, reproducible; 2 = minor drift, quick to reconcile; 1 = meaningful drift, prod-only bugs; 0 = environments are not the same product.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: run diffs, reconcile to the migration baseline, rebuild staging from migrations. Structural fix: migrations-as-only-path for every env, fresh-env CI per PR, schema-diff check in CI (fail on env drift), fixture strategy generated from migrations.
- **Gold standard / target state:** Zero diffs between baseline and any env; fresh environments reproducible; "prod-only bug" eliminated as a category.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Cross-environment schema states (dev/staging/prod catalogs) — live plane. One repo cannot contain them.

## 6. Detection recipe

- **Detection method:** Schema diff — run a schema-diff tool (mysqldiff, pg-diff, `schema-diff`, Liquibase `diff`) between dev→staging→prod and the migration baseline; check fixture strategy (are fixtures migration-generated or hand-maintained?); compare CI's fresh-env build against prod; measure the "time to stand up a prod-like env."

1. Schema-diff tool (`liquibase diff`, `migra`, `pg-diff`) between env connections supplied by owner.
2. Compare against migration baseline head.
3. Fixture-strategy audit (migration-generated vs hand-maintained fixtures) is the one in-repo hint — emission context only.

**v1 behavior:** `unknown` + emission text.

## 7. Fact schema

```json
{"data10": {"status": "unknown",
             "reason": "requires schema diffs across live environments",
             "fixture_hint": {"hand_maintained_fixtures": true}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never from URL
estimated_when: never                            # fixture hints prove nothing about prod drift
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs dev→staging→prod schema diffs against migration head (M&A access)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Cross-env drift; the migration chain that should prevent it is DATA-01.
