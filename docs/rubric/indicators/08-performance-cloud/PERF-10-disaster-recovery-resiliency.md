# PERF-10 — Disaster Recovery & Resiliency

> **Category:** [Performance & Cloud/Infrastructure Fit](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | PERF-10 |
| Name | Disaster Recovery & Resiliency |
| Category | PERF — Performance & Cloud/Infrastructure Fit |
| Engine tier | D |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none (complements DATA-06's G7 on the backup half; DR-drill half stays human) |
| Rollup / deep-dive | deep-dive · `folds_into: PERF` |
| Verify effort | 🔷 ~1–2 days — DR audit + (ideally) a drill. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There's no demonstrable disaster-recovery capability — no DR drills, no documented RTO/RPO, single-region/AZ with no plan, no cross-region data strategy, and recovery logic (if any) has never been exercised. "Resilience" is a hope.
- **Why it signals obsolescence:** DR is the final verdict on infrastructure posture — it's the difference between "we have servers" and "we have a business that survives a datacenter event." Modern platform practice treats region/AZ distribution + tested failover as a baseline for anything production-critical. A system that can't answer "what happens if this region dies" has inherited a pre-cloud mental model.
- **Where it manifests:** Single region/AZ for everything, no RTO/RPO numbers, DR "runbook" that's a google doc from 2016, no failover tests ever run, backups (DATA-06) not tied to a restore plan, "we'd figure it out" as the DR plan.
- **Objective metric:** `last successful DR drill (days)`; `RTO/RPO defined + met?`; `cross-region coverage % of critical services`; `time to recover a region (drilled) vs. target`.
- **Yellow flag (warning):** Single/limited redundancy, no drills in > 6 months, RTO/RPO undocumented-but-roughly-implied. *(Rationale: warning — you're one event from discovering the plan is fiction.)*
- **Red flag (critical):** No DR plan/doc, no drills ever, single-region single-point-of-failure for the whole system, and no cross-region data path. *(Rationale: a regional event is a company-ending event — no resilience exists to be modernized here.)*
- **Example symptom:** "The board asks what happens if the us-east-1 region is down. Answer: 'we don't have a plan — we hope the cloud does.' Every system is single-region; the mobile app can't run without it. The resilience budget request is denied because 'it works today.'"
- **Blast radius:** Company continuity, availability SLOs, customer trust, insurance/regulatory (DR required), brand (a "cloud outage kills us" story).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = multi-region, drilled, RTO met; 2 = multi-AZ, drills rough; 1 = single-region with plan in head; 0 = no DR, region event = shutdown.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write the DR plan (real: recover critical path), define RTO/RPO per tier, take documented cross-region snapshots for the critical DB, run a tabletop then a real drill. Structural fix: ring-fence the critical path into multi-AZ → multi-region with tested failover, async replication strategy, automated failover runbooks, drills scheduled quarterly as a non-negotiable ritual.
- **Gold standard / target state:** Critical path survives a region event within RTO (drilled and proven), RTO/RPO documented, drills are boring quarterly calendar items, recovery is automated not theatrical.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- RTO/RPO docs, multi-region topology, drill history — infra/org plane.

## 6. Detection recipe

- **Detection method:** DR audit — documented RTO/RPO? cross-region/AZ redundancy for the critical path? Failover drills (last successful full-region drill date/time)? Multi-region data strategy (async replication? snapshots?)? Test: literally ask the team to run the DR plan and time it (a drill).

None in v1. In-repo hints (multi-region blocks in IaC, replication configs, runbook references) are emission context; backup/restore evidence is DATA-06's row — no double-scoring.

## 7. Fact schema

```json
{"perf10": {"status": "unknown",
             "reason": "DR provable only via drills and infra audit",
             "context": {"multi_region_iac_blocks": 0}}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never in v1
estimated_when: never                            # IaC hints ≠ drilled capability either way
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

none (DATA-06 owns the data-rescue gate).

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs documented RTO/RPO + last successful failover drill (deep scan)"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Failover/resiliency drills; backup/restore lifecycle is DATA-06.
