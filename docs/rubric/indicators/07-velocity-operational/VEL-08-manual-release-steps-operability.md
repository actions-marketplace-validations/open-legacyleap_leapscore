# VEL-08 — Manual Release Steps & Operability

> **Category:** [Developer Velocity & Operational Drag](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | VEL-08 |
| Name | Manual Release Steps & Operability |
| Category | VEL — Developer Velocity & Operational Drag |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | **G6** (with VEL-03) — manual-deploy half |
| Rollup / deep-dive | standard · folds into VEL category % |
| Verify effort | 🔶 ~2–4 h — last-releases walkthrough + access audit. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Releasing requires human, tool-less steps — SSH-ing to prod, editing files there, running commands by hand, sharing credentials, a "release manager" clicking through, or no deploy automation at all.
- **Why it signals obsolescence:** Manual releases are the coarse end of the CI/CD spectrum — they cap frequency, inherit human error, require privileged access by hand, and make auditing who-did-what impossible. In the era of a button per service, a script run by one person with prod SSH is a definition of operational debt. It's also the second half of gate G6.
- **Where it manifests:** Deploy runbooks ("SSH to x, pull, run migration, restart"), no CI on release path, someone's terminal of recorded commands, vendor-wrap deploy steps, prod edited directly (hotfixes in vim), shared prod credentials, no audit of deployments.
- **Objective metric:** `% of releases fully automated`; `# of manual steps in the release path`; `prod-direct-edit incidents`; `deploy audit trail present?`; `shared prod creds?`.
- **Yellow flag (warning):** Some manual release steps (a couple of hand SQL/migrations, config push), automated enough to be "mostly CI." *(Rationale: warning — a bit of heroic residue, still runnable by a trained person.)*
- **Red flag (critical):** Deploys *only* happen via manual scripts on prod hosts, or prod is routinely edited by hand (triggers **G6**). *(Rationale: the release path is one human's terminal — fragile, un-auditable, unscalable.)*
- **Example symptom:** "The release is: `ssh prod-api`, `git pull`, `php artisan migrate`, `touch restart`, watch the logs, pray. Last month Bob ran the migration twice because the terminal scrolled. The audit question 'who deployed?' has no answer."
- **Blast radius:** Deploy frequency ceiling, human-error incidents, audit compliance, access security, scaling (only a few people can release), release risk.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = fully automated + audited; 2 = some manual residue; 1 = mostly manual pipeline; 0 = script-on-prod is the release path (G6).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: capture the manual steps as a CI/CD job (artifact → deploy), remove direct prod SSH, add an audit log of every deployment. Structural fix: full automated promotion (CI build artifact → envs), IaC-managed infra (PERF-06), deploy from immutable artifacts (never from a checkout on a server), prod access by deploy pipeline only.
- **Gold standard / target state:** Zero manual steps; deploys are CI pipeline promotions with audit; prod editability removed; an audience of "the pipeline did it" for every release.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + gh-api
- **Tools:** deploy-job detection in CI configs (environment deployment jobs, `deploy` steps, CD workflows); release-automation markers (`semantic-release`, `release-please`, `goreleaser`, `auto`); prod-edit script greps (`ssh `+prod aliases in scripts, `kubectl exec --it` runbooks as procedure); rollback-path evidence (`rollback` job/target)
- **Rate-cost:** none/api-light
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos; no CI at all → measured score-0 territory (manual-by-default), clause-b evidence.

## 6. Detection recipe

- **Detection method:** Release-path audit — trace the last 5 releases end-to-end: was anything done by hand? cin which env did commands run? Is there a CI/CD artifact → environment promotion path? Check for prod direct edits, shell-history deploys, deployment audit logs.

1. Trace artifact→environment promotion: build job → registry push → deploy job chain present?
2. Classify last-mile: automated CD / one-command manual / multi-step manual (from scripts+docs procedure density).
3. Rollback path: dedicated job/target vs "revert and redeploy" prose only.
4. Prod-direct-edit smell inventory.

Preconditions: CI parse (TEST-08 shared).

## 7. Fact schema

```json
{"vel08": {
  "cd_chain": {"build": true, "registry_push": true, "deploy_job": false},
  "release_automation": {"tool": null},
  "rollback_target": false,
  "manual_procedure_steps_est": 14,
  "prod_direct_edit_smells": [{"file": "ops/fix.sh", "pattern": "ssh prod"}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # automation presence/absence decidable statically
estimated_when: partial CI parse               # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium
scope_limited:  deploy infra outside repo -> estimated + scope-limited note
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: full CD chain ∧ rollback target ∧ zero prod-edit smells
- `2`: automated build+push, one-command manual last mile
- `1`: multi-step manual deploys ∨ rollback prose-only
- `0`: no deploy automation at all ∨ prod-direct-edit culture signals on core ops

## 9. Gate, failure, and budget behavior

### Gate hooks

This row's Red predicate is G6's second half. Orchestrator marks G6:
- `needs-verification` when this row measures Red but VEL-03 CFR is unknown (the v1 norm)
- `proven` only when VEL-03 also proves its half (v2)

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
evidence: "release-audit: cd-chain b/p/d={bool}/{bool}/{bool}; rollback={bool}; ~{n} manual steps; smells={k}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Release-path mechanics; deploy outcomes are VEL-03, frequency VEL-04.
