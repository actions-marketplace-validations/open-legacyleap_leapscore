# DATA-06 — Data Lifecycle Management Deficits

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DATA-06. Edit this file; the legacy path [data-06_data-lifecycle-management-deficits.md](../../../specs/05_DATA_SCHEMA/data-06_data-lifecycle-management-deficits.md) is a compatibility alias.
> **Category:** [Data & Schema Evolution](../../05_DATA_SCHEMA.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/05_DATA_SCHEMA/DATA-06_data-lifecycle-management-deficits.md`

## 1. Identity

| field | value |
|---|---|
| ID | DATA-06 |
| Name | Data Lifecycle Management Deficits |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | unknown |
| v1 flag | PART (candidate) |
| Gates fed | **G7** — data-rescue risk (as needs-verification in v1) |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | ⚡ ≤ 30 min to inspect; 🔷 for a real restore drill. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** No coherent data lifecycle — retention is unmanaged ("keep everything forever" or "deleting is terrifying"), archival doesn't exist, backups are untested, PII has no expiry, and restore is a rumor.
- **Why it signals obsolescence:** Lifecycle management is a modern compliance/ops baseline. Its absence means: storage costs grow unbounded, GDPR/CIPA/retention obligations are unmet, and — the worst failure mode — the system has no *verified* recovery path. A database you've never restored doesn't actually protect anything. This is also a legal/liability liability that compounds with every passing year.
- **Where it manifests:** No retention policy documentation, prod data copied everywhere (dev DBs full of PII), backups run but never restore-tested, no archival tier, GDPR deletion requests "manually handled," data shuffling "just in case."
- **Objective metric:** `last successful restore drill (days ago)`; `% of prod data with a retention rule`; `restore time/RTO vs. target`; `# of envs holding prod PII without need`; `erasure capability exercised in tests?`.
- **Yellow flag (warning):** Backups run but restore untested (> 90 days), no retention policy, some prod-data sprawl to dev. *(Rationale: warning — the pounce path is unverified.)*
- **Red flag (critical):** No backups at all, or restore never successfully performed/untestable, or retention/erasure legally required and absent. *(Rationale: you cannot recover the data you legally must manage — operational and compliance failure.)*
- **Example symptom:** "The 'backup' is `mysqldump > file if cron feels like it`. Nobody has ever executed a restore. The GDPR erasure request arrives; the answer is 14 days of DBA archaeology across 5 dumps. And the CFO asks why storage is up 40% YoY."
- **Blast radius:** Data loss, RTO/RPO failures, regulatory fines, storage cost, breach liability (retention of unnecessary PII).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = restore-verified, retention automated; 2 = backups untested/retention partial; 1 = no restore evidence, retention absent; 0 = no backups or no legal capability.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: prove restore works this week (schedule a drill), set retention tiers, stop seeding dev with PII. Structural fix: automated backup verification, retention/archival jobs, PII minimization (anonymization in non-prod), erasure workflow as software, RTO/RPO SLOs with drills scheduled.
- **Gold standard / target state:** Restore drills quarterly and green, retention automated, zero PII sprawl in dev, erasure request fully exercisable, RTO/RPO met.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + gh-api (scheduled workflows)
- **Tools:** backup-evidence sweep: scheduled CI workflows (`schedule:` cron with `pg_dump`/`mysqldump`/snapshot steps), IaC backup config (`backup_vault`, PITR flags, versioning on buckets, snapshot policies), retention jobs (TTL/lifecycle rules), restore-drill artifacts (runbooks mentioning restore tests, CI jobs executing restores)
- **Rate-cost:** api-budgeted (workflow list)
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b (holds critical data? if no persistence layer at all → N/A). Else applicable.

## 6. Detection recipe

- **Detection method:** Audit — retention policy docs vs. actual jobs; backup logs and *restore test evidence* (last successful restore drill); PII copy map (which envs/dumps hold production PII); storage growth vs. retention trend; erasure feature exists and is exercised in tests.

1. Enumerate backup-producing configs across CI + IaC.
2. Classify: automated-with-retention / ad-hoc-script-only / absent.
3. Restore-drill evidence: executable restore paths in repo/CI vs prose claims.
4. PII-copy map hint: dump/seed files in tree flagged by name patterns only.

Preconditions: persistence present.

## 7. Fact schema

```json
{"data06": {
  "backup_jobs": [{"kind": "ci-cron", "evidence": ".github/workflows/backup.yml", "retention_configured": false}],
  "iac_pitr_or_versioning": true,
  "restore_drill_evidence": false,
  "lifecycle_rules_present": false}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # drill evidence lives outside repo mostly
estimated_when: >=1 lifecycle artifact enumerated  # clamp [1,2]; confidence medium iff backup+retention both seen
unknown_when:   no infra/config in repo (managed elsewhere)
na_when:        applicability fired
clamp:          [1,2]
confidence:     low when evidence is absence-shaped ("no backups visible" ≠ "no backups")
scope_limited:  managed-cloud posture -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: automated backups ∧ some retention config; drills unevidenced
- `1`: ad-hoc scripts only ∨ retention absent ∨ nothing visible for a critical-data system
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

Never `proven` from URL (drill history unknowable). States:
- `needs-verification`: default whenever system holds critical data ∧ no restore-drill evidence in-repo — the common case; top deep-dive item
- `not-proven`: automated backup + retention + executed restore job all evidenced
- `proven`: unreachable in v1 by rule (record explicitly)

### Failure and budget semantics

- Budget class: `fast`
- Absence-shape rule: zero visible backup config yields confidence-low estimate, and the report copy must say "not visible in repo", not "has no backups"

## 10. Evidence and output

### Evidence string

```
basis: "lifecycle-sweep: backup={kind@path}; retention={bool}; drill-evidence={bool} [repo-visible set]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Lifecycle/backup/restore posture; storage technology age is DATA-04, compliance retention controls SEC-08.
