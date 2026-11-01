# VEL-05 — Onboarding Lead Time to First Production PR

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for VEL-05. Edit this file; the legacy path [vel-05_onboarding-lead-time-to-first-production-pr.md](../../../specs/07_VELOCITY_OPERATIONAL/vel-05_onboarding-lead-time-to-first-production-pr.md) is a compatibility alias.
> **Category:** [Developer Velocity & Operational Drag](../../07_VELOCITY_OPERATIONAL.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/07_VELOCITY_OPERATIONAL/VEL-05_onboarding-lead-time-to-first-production-pr.md`

## 1. Identity

| field | value |
|---|---|
| ID | VEL-05 |
| Name | Onboarding Lead Time to First Production PR |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | D |
| Default status | unknown |
| v1 flag | NO |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — HR/git data + onboarding review. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** A new engineer takes weeks (not days) to reach "shipped my first change to production," and the lag is a feature of the codebase, not of the hire.
- **Why it signals obsolescence:** Time-to-first-PR is the sum of every knowledge and environment debt in one number: unclear architecture, missing docs, painful setup (VEL-02), scary deploys, knowledge silos. It's also a recruiter's and retention metric — candidates who take a month to feel productive leave.
- **Where it manifests:** Onboarding documentation sparse or stale, no starter tickets, architecture "must shadow for 3 weeks before touching anything," complex setup blocks, tribal knowledge required to understand safe places to change, first PR weeks out.
- **Objective metric:** `median days to first production PR`; `% of hires shipping within 2 weeks`; `onboarding doc freshness`; `# of blockers reported (envs, permissions, knowledge)`.
- **Yellow flag (warning):** 2–4 weeks to ship first PR; onboarding partially documented. *(Rationale: warning — above the modern two-week line, still tolerable.)*
- **Red flag (critical):** > 4 weeks for most hires, or onboarding is oral/tribal with no written path. *(Rationale: the codebase's knowledge is not transferable — that's a structural timer on the team.)*
- **Example symptom:** "The last three engineers all took 5–6 weeks to ship anything: 3 days on setup, then two weeks of 'shadow the architecture' sessions, then a scary deploy scared them into review loops. Two of the three left within a year — 'I never felt productive.'"
- **Blast radius:** Hiring ROI, retention, time-to-contribution, knowledge transfer, team scale (onboarding debt caps team growth).

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = < 1 week; 2 = 2–4 weeks; 1 = > 4 weeks, documented-ish; 0 = onboarding entirely tribal.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: write a "first PR in a day" path (a safe starter ticket + doc patch + tiny config change), assign onboarding buddy + SLA, grant prod deploy gradually but early. Structural fix: fix the underlying debts (setup VEL-02, docs DOCS, deploy VEL-03), curriculum-style onboarding (architecture walkthroughs, ADRs), starter-ticket backlog maintained.
- **Gold standard / target state:** New engineers ship to prod within their first week, via documented path, with a clear map of the safe-to-change surfaces.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- Hire dates + authorship joins — HR/org plane. No URL signal.

## 6. Detection recipe

- **Detection method:** Onboarding tracking — time from start to first merged prod-change PR per hire (git + HR data), onboarding survey (self-reported productiveness date), review of onboarding docs/tickets, "first-change" blocker log (what did they wait on?).

None in v1. Proxies (CONTRIBUTING quality, VEL-02 posture) belong to other rows; this row does not double-score them.

## 7. Fact schema

```json
{"vel05": {"status": "unknown", "reason": "requires per-hire join of start date to first merged prod PR"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never
estimated_when: never
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
emission: "unknown — needs git+HR join per hire (org data); setup posture proxies live in VEL-02"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Onboarding time-to-contribution; the docs/tooling that influence it are DOCS-04/VEL-02 rows.
