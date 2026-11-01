# DATA-06 — Data Lifecycle Management Deficits — Implementation Spec

> **Authority:** This file defines the DATA-06 implementation contract. The [DATA rubric category](../../rubric/05_DATA_SCHEMA.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (backup-job presence proxy; encyc B·unknown, matrix C·unknown) |
| v1 flag | PART (candidate) |
| Gates fed | **G7** — data-rescue risk (as needs-verification in v1) |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔶 human (drill evidence audit) |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-06 |

## 1. Inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + gh-api (scheduled workflows)
- **Tools:** backup-evidence sweep: scheduled CI workflows (`schedule:` cron with `pg_dump`/`mysqldump`/snapshot steps), IaC backup config (`backup_vault`, PITR flags, versioning on buckets, snapshot policies), retention jobs (TTL/lifecycle rules), restore-drill artifacts (runbooks mentioning restore tests, CI jobs executing restores)
- **Rate-cost:** api-budgeted (workflow list)
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b (holds critical data? if no persistence layer at all → N/A). Else applicable.

## 2. Detection recipe

1. Enumerate backup-producing configs across CI + IaC.
2. Classify: automated-with-retention / ad-hoc-script-only / absent.
3. Restore-drill evidence: executable restore paths in repo/CI vs prose claims.
4. PII-copy map hint: dump/seed files in tree flagged by name patterns only.

Preconditions: persistence present.

## 3. Fact schema

```json
{"data06": {
  "backup_jobs": [{"kind": "ci-cron", "evidence": ".github/workflows/backup.yml", "retention_configured": false}],
  "iac_pitr_or_versioning": true,
  "restore_drill_evidence": false,
  "lifecycle_rules_present": false}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # drill evidence lives outside repo mostly
estimated_when: >=1 lifecycle artifact enumerated  # clamp [1,2]; confidence medium iff backup+retention both seen
unknown_when:   no infra/config in repo (managed elsewhere)
na_when:        applicability fired
clamp:          [1,2]
confidence:     low when evidence is absence-shaped ("no backups visible" ≠ "no backups")
scope_limited:  managed-cloud posture -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DATA-06. Estimated ⇒ score ∈ {1,2}:

- `2`: automated backups ∧ some retention config; drills unevidenced
- `1`: ad-hoc scripts only ∨ retention absent ∨ nothing visible for a critical-data system
- `3`/`0` unreachable by construction

## 6. Gate hooks (G7)

Never `proven` from URL (drill history unknowable). States:
- `needs-verification`: default whenever system holds critical data ∧ no restore-drill evidence in-repo — the common case; top deep-dive item
- `not-proven`: automated backup + retention + executed restore job all evidenced
- `proven`: unreachable in v1 by rule (record explicitly)

## 7. Failure & budget semantics

- Budget class: `fast`
- Absence-shape rule: zero visible backup config yields confidence-low estimate, and the report copy must say "not visible in repo", not "has no backups"

## 8. Evidence string

```
basis: "lifecycle-sweep: backup={kind@path}; retention={bool}; drill-evidence={bool} [repo-visible set]"
```

## 9. Scope/overlaps echo

Lifecycle/backup/restore posture; storage technology age is DATA-04, compliance retention controls SEC-08.
