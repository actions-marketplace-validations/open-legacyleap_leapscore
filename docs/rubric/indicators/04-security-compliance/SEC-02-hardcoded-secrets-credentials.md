# SEC-02 — Hardcoded Secrets & Credentials

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-02 |
| Name | Hardcoded Secrets & Credentials |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | A |
| Default status | measured |
| v1 flag | YES |
| Gates fed | **G1** — credential exposure |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | ⚡ ≤ 30 min — three scanner runs. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** API keys, passwords, tokens, database credentials, private keys, or S3/cloud credentials are hardcoded in source code, committed in history, present in config files in the repo, or exposed in logs/artifacts.
- **Why it signals obsolescence:** This is the clearest "belongs to a previous era" signal — modern practice is secret management (Vault/AWS Secrets Manager/SSM/env-injection) from day one. Hardcoded secrets indicate not just one mistake but an absence of the *tooling* and *discipline* that modern systems have. It's a gate (G1) because active secrets are directly exploitable.
- **Where it manifests:** `password = "..."`, `AWS_SECRET=AKIA...`, `.env` committed to the repo, config files with creds, connection strings with embedded passwords, keys in image layers, secrets in build logs, API docs with tokens.
- **Objective metric:** `# of active (verified/valid) secrets`; `# of secrets in git history`; `revoked vs. unrevoked`; `scanner configured in CI + on history`; `time to rotate an exposed secret`.
- **Yellow flag (warning):** Secrets in commit history that are already revoked/rotated; a few live tokens in non-prod configs. *(Rationale: a real hygiene failure, but not immediately exploitable.)*
- **Red flag (critical):** Active, valid credentials in source, config, or history — especially in core/prod paths (triggers **G1**). *(Rationale: direct, immediate compromise: the credential works today.)*
- **Example symptom:** "A new hire clones the repo and finds `db-password: P@ssw0rd!` in `application.yml`, committed four years ago. Gitleaks confirms the same string appears in 200 build-log archives. The key still works."
- **Blast radius:** Data breach, account takeover, lateral movement, supply-chain (CI tokens), regulatory fines, brand damage.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no secrets, manager in place; 2 = revoked secrets in history only; 1 = live secret in a non-critical config; 0 = active creds in core/prod (G1).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: rotate EVERY leaked credential immediately (the exposure window starts at commit time, not discovery time), remove from current tree, switch to env vars. Structural fix: adopt a secret manager + injection (Vault, Secrets Manager), ban secrets in code via CI scanners on every commit *and* a history scrub, least-privilege per environment, kill the "secrets in docs" habit.
- **Gold standard / target state:** Zero secrets in the tree or history; secrets injected at runtime from a manager; CI blocks secret commits; rotation drill run annually.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** git (full clone incl. history)
- **Tools:** `gitleaks >= 8` (`detect --report-format json`, `--log-opts=--all` for history), trufflehog verification pass optional (`--only-verified`)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Secret scanners — Gitleaks, TruffleHog, `git secret scan`, Semgrep secret rules, GitHub secret scanning, `trufflehog git file://. --only-verified`; scan current tree *and* full git history; check container image layers (`dive`, Trivy secret scan); check logs/artifacts.

1. Tree scan: `gitleaks detect --source {clone} --report-format json --report-path …`
2. History scan: same with `--log-opts="--all"` (history budget: `--max-depth` per clone budget; truncation recorded).
3. Verification: for AWS/GCP/Stripe-class rules, mark `verified` when trufflehog confirms live; else `unverified`.
4. Classify location: current-tree vs history-only vs both; join files to core-path set.

Preconditions: full-history clone within budget; else scope-limited path below.

## 7. Fact schema

```json
{"sec02": {
  "tree_findings": [{"rule": "aws-access-token", "file": "config/prod.py", "verified": false}],
  "history_only_findings": 6,
  "verified_live": 0,
  "history_scanned_full": true}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  gitleaks completed on tree (+history if available)
estimated_when: never                            # scanner output is fact; absence-after-scan is not-proven evidence
unknown_when:   scanner failed to run at all
na_when:        never
clamp:          [1,2]                             # n/a — measured-only row
confidence:     medium; low if history truncated
scope_limited:  history budget hit -> measured + scope-limited note (tree result stands)
```

### Score mapping predicates

Criteria: see §3.

- `3`: zero findings anywhere, clean-run evidence
- `2`: history-only findings, all plausibly rotated (age > rotation window) — Yellow band per entry
- `1`: unverified findings in isolated paths, or aged history-only secrets in core paths
- `0`: any finding in current tree ∧ (in core/config-deploy path ∨ verified-live)

## 9. Gate, failure, and budget behavior

### Gate hooks

- `proven`: verified-live secret ∨ current-tree finding on deploy/auth/core path
- `not-proven`: clean tree + full history scanned
- `needs-verification`: findings present but history truncated or verification unavailable

### Failure and budget semantics

- Budget class: `fast` (bounded by repo size)
- Oversized history → shallow-since budget → `scope-limited`; scanner crash → retry once → unknown

## 10. Evidence and output

### Evidence string

```
evidence: "gitleaks: tree={t} findings ({v} verified-live); history-only={h} (full={bool}); worst {rule}@{file}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Secrets/credentials in source, config, and history; supply-chain malware risk is ECOS-10.
