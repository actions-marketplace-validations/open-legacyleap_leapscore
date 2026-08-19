# 04 — Security, Compliance & Vulnerability

> **Weight:** 20% · **Standard:** SEC-01…08 · **Deep-dive:** SEC-09, 10
>
> **One-line thesis:** Security debt is the only debt that can end the company. A codebase that treats security as an afterthought is obsolete in the most literal sense — it belongs to an era we no longer permit.

**Category summary:** The highest-weight category (20%). Scores the system's vulnerability posture, credential hygiene, security controls, auth, auditability, supply-chain safety, patch cadence, and compliance standing. Four gating kill-switches (G1, G2, G4) live here — more than any other category — because security Red Flags cap the modernization verdict.

---

## Standard indicators

### SEC-01 — Unpatched Vulnerabilities
- **Definition:** Known, scored vulnerabilities (OSV/CVEs) affecting the runtime, dependencies, or container images are present, and unpatched — with an age beyond acceptable exposure windows.
- **Why it signals obsolescence:** Every unpatched CVE is a *known* open door. The CVE age is a direct measure of maintenance abandonment: modern teams patch in days; obsolete systems accumulate for months. It's also the most defensible, unarguable "this codebase is obsolete" datum you can hand an executive.
- **Where it manifests:** SCA reports (Snyk/Dependabot/Trivy/OSV), image scans (Trivy/Grype/Clair), patch dashboards, CVEs on the lockfile, "no scan exists" in CI.
- **Detection method:** Software Composition Analysis — `trivy repo/image`, `snyk test`, `npm audit`, `pip-audit`, `osv-scanner`, `dependabot` alert dashboard, Grype. Produce a themed report: critical/high/open-days/exposure (is the affected path internet-exposed?). Filter noise (dev-only, reachability consideration).
- **Objective metric:** `# of Critical CVEs open`; `# of High CVEs open`; `median age (days) of open Critical/High CVEs`; `# of exposed (internet-reachable) critical CVEs`.
- **Yellow flag (warning):** 1–5 High CVEs open > 30 days, or any Critical open ≤ 14 days but already in the patch queue. *(Rationale: known risk with a live fix-window — warning, not fire, provided the trend is downward.)*
- **Red flag (critical):** Any Critical CVE > 14 days on an internet-exposed path (triggers **G2**), or High CVEs accumulating with no patch process. *(Rationale: an exposed, known-critical vuln older than two weeks is a breach waiting to happen.)*
- **Example symptom:** "Trivy shows a Critical RCE in the image parser we serve user uploads with — 23 days old. The fix exists. Dependabot opened a PR; it's been sitting behind other 'priorities' for three weeks."
- **Blast radius:** Breach risk, compliance audits, customer trust, sales/due-diligence, insurance (cyber policies ask for patch cadence).
- **Remediation playbook:** Quick win: patch the open Criticals/Highs in the exposure window — today; re-scan. Structural fix: a patch SLA policy (Critical ≤ 7 days, High ≤ 30), automated patching (Dependabot/Renovate auto-merge with CI as the gate), and a "no open Critical in prod" rule enforced by the security review.
- **Gold standard / target state:** Zero open Criticals; Highs < 30 days; automated scans in CI; patch SLA documented and met for 4 straight quarters.
- **Scoring guidance:** 3 = zero open criticals, SLAs met; 2 = high CVEs 30–60 days; 1 = critical open in isolated path; 0 = exposed critical > 14 days (G2).
- **Verify effort:** 🔶 ~2–4 h — scan runs + reachability analysis.

### SEC-02 — Hardcoded Secrets & Credentials
- **Definition:** API keys, passwords, tokens, database credentials, private keys, or S3/cloud credentials are hardcoded in source code, committed in history, present in config files in the repo, or exposed in logs/artifacts.
- **Why it signals obsolescence:** This is the clearest "belongs to a previous era" signal — modern practice is secret management (Vault/AWS Secrets Manager/SSM/env-injection) from day one. Hardcoded secrets indicate not just one mistake but an absence of the *tooling* and *discipline* that modern systems have. It's a gate (G1) because active secrets are directly exploitable.
- **Where it manifests:** `password = "..."`, `AWS_SECRET=AKIA...`, `.env` committed to the repo, config files with creds, connection strings with embedded passwords, keys in image layers, secrets in build logs, API docs with tokens.
- **Detection method:** Secret scanners — Gitleaks, TruffleHog, `git secret scan`, Semgrep secret rules, GitHub secret scanning, `trufflehog git file://. --only-verified`; scan current tree *and* full git history; check container image layers (`dive`, Trivy secret scan); check logs/artifacts.
- **Objective metric:** `# of active (verified/valid) secrets`; `# of secrets in git history`; `revoked vs. unrevoked`; `scanner configured in CI + on history`; `time to rotate an exposed secret`.
- **Yellow flag (warning):** Secrets in commit history that are already revoked/rotated; a few live tokens in non-prod configs. *(Rationale: a real hygiene failure, but not immediately exploitable.)*
- **Red flag (critical):** Active, valid credentials in source, config, or history — especially in core/prod paths (triggers **G1**). *(Rationale: direct, immediate compromise: the credential works today.)*
- **Example symptom:** "A new hire clones the repo and finds `db-password: P@ssw0rd!` in `application.yml`, committed four years ago. Gitleaks confirms the same string appears in 200 build-log archives. The key still works."
- **Blast radius:** Data breach, account takeover, lateral movement, supply-chain (CI tokens), regulatory fines, brand damage.
- **Remediation playbook:** Quick win: rotate EVERY leaked credential immediately (the exposure window starts at commit time, not discovery time), remove from current tree, switch to env vars. Structural fix: adopt a secret manager + injection (Vault, Secrets Manager), ban secrets in code via CI scanners on every commit *and* a history scrub, least-privilege per environment, kill the "secrets in docs" habit.
- **Gold standard / target state:** Zero secrets in the tree or history; secrets injected at runtime from a manager; CI blocks secret commits; rotation drill run annually.
- **Scoring guidance:** 3 = no secrets, manager in place; 2 = revoked secrets in history only; 1 = live secret in a non-critical config; 0 = active creds in core/prod (G1).
- **Verify effort:** ⚡ ≤ 30 min — three scanner runs.

### SEC-03 — Missing Web Security Controls
- **Definition:** The application is missing modern transport/presentation security controls — TLS configuration outdated (TLS 1.0/1.1), missing security headers (CSP, HSTS, X-Content-Type-Options, frame options), no input validation/sanitization at entry points, no output encoding — and OWASP Top-10 classes (SQLi, XSS, RCE, SSRF) are reachable in application flows.
- **Why it signals obsolescence:** Web security controls are the *price of entry* for a modern system — they're free to add and non-negotiable by default in any modern framework. Their absence marks a codebase that predates the security education of the last decade. Reachable OWASP Top-10 classes in core flows is a gate (G4).
- **Where it manifests:** Response headers (curl `-I`), TLS scan (ssllabs, `testssl.sh`), raw SQL string concatenation, unsanitized user input into queries/renderers, `innerHTML` with user data, unvalidated file uploads, SSRF-able fetch targets, deserialization of untrusted input.
- **Detection method:** DAST (OWASP ZAP, Burp, Nuclei) against a staging env, SAST (Semgrep, SonarQube, CodeQL rule packs) for injection patterns, header/TLS scanning (`testssl.sh`, Mozilla Observatory, `securityheaders.com`), manual review of input-handling paths. Map findings to OWASP Top-10 categories and reachability.
- **Objective metric:** `# of reachable Top-10 findings (SQLi/RCE/XSS/SSRF break glass)`; `security header coverage %`; `TLS version/protocol grade`; `# of input paths without validation`.
- **Yellow flag (warning):** Missing headers, outdated TLS (1.1 tolerated), input validation incomplete on non-critical paths. *(Rationale: hardening gaps — real but not immediately exploitable at scale.)*
- **Red flag (critical):** Reachable SQLi/RCE/broken auth/SSRF in core flows, or no input validation at all at any entry point (triggers **G4**). *(Rationale: actively exploitable vulnerability classes in the software's purpose — a breach in training.)*
- **Example symptom:** "ZAP finds a blind SQLi in the search endpoint built by string concatenation ('the old codebase was like that'). The TLS config allows 1.0. Observatory scores the headers 20/100. All of it is 'legacy we've been meaning to fix.'"
- **Blast radius:** Data breach, regulatory action, customer trust, insurance, sales security reviews.
- **Remediation playbook:** Quick win: enable modern headers (HSTS/CSP via middleware), upgrade TLS, fix the top reachable injection points with parameterized queries and validation. Structural fix: framework defaults (most modern frameworks secure headers by default — upgrade), SAST+DAST in CI, input validation at every entry, an injection-class bug ban (semantic gate).
- **Gold standard / target state:** A+ header/TLS grades, zero reachable Top-10 findings, SAST+DAST wired into CI, validation at all boundaries.
- **Scoring guidance:** 3 = no findings, A grades; 2 = hardening gaps outside core; 1 = reachable finding in isolated path; 0 = reachable Top-10 in core (G4).
- **Verify effort:** 🔶 ~2–4 h — DAST/SAST run + header scan.

### SEC-04 — Authentication & Authorization Weaknesses
- **Definition:** Weak or missing authN/authZ: default credentials, no auth on admin/internal endpoints, session flaws (predictable tokens, no expiry/rotation), broken password policy, missing MFA on privileged access, coarse or absent role-based access control, broken authorization checks (IDOR).
- **Why it signals obsolescence:** Modern systems treat auth as infrastructure (OIDC/SAML SSO, MFA, policy engines). A codebase rolling its own sessions with a hand-rolled token scheme, or protecting admin paths by convention, is an era artifact — and the results are directly exploitable (part of G4).
- **Where it manifests:** Default creds (`admin/admin`) in setup scripts, session tokens as mutable cookies, no expiry/rotation, `isAdmin` checked on the client, authorization checked on the UI not the server, no MFA anywhere (especially admin), homegrown JWT without verification of `alg`, IDOR (fetching by id without ownership check).
- **Detection method:** Security review (pentest-style) of auth flows, SAST rules (broken access control), manual walk of admin/internal endpoints with auth stripped, session inspection (token predictability/expiry), OWASP ZAP "forced browsing," check for client-side-only authorization, IDOR probes on object-id endpoints.
- **Objective metric:** `# of endpoints without auth`; `# of admin paths unauthenticated`; ``isAdmin` client-side checks count`; `session max-age / rotation conformance`; `MFA coverage % on privileged roles`.
- **Yellow flag (warning):** Weak session policy (long expiry, no rotation), coarse RBAC (all-or-nothing admin), no MFA on some privileged paths, some IDOR-able endpoints. *(Rationale: real weaknesses under the "still auth'd" threshold.)*
- **Red flag (critical):** Default/known credentials, unauthenticated admin/internal paths, org-level broken authN (session hijackable), or authorization enforced only client-side in core flows. *(Rationale: the barrier either doesn't exist or is client-side theater.)*
- **Example symptom:** "An internal tool has `admin/admin` in its Dockerfile 'for local use' — and it's exposed via the load balancer. A pentest logs in with the default, then lists every customer's records because authorization is a client-side flag."
- **Blast radius:** Complete account/data compromise, regulatory action, downstream customer breaches, trust collapse.
- **Remediation playbook:** Quick win: kill default creds, add auth + server-side authorization to every endpoint (route registry), enable MFA on privileged roles, fix the top IDORs. Structural fix: move to managed identity (SSO/OIDC, platform IAM), policy-based authorization (OPA/AWS IAM/ABAC), automated authz tests (walk every route asserting enforcement), session best practices.
- **Gold standard / target state:** All endpoints server-side auth'd and authz'd, MFA everywhere privileged, managed SSO + policy engine, authz coverage test in CI.
- **Scoring guidance:** 3 = managed identity + enforced authz; 2 = weakness in non-critical areas; 1 = broken control in an isolated service; 0 = default creds / unauthorized admin / client-side-only (G4).
- **Verify effort:** 🔶 ~2–4 h — route audit + session/cred review.

### SEC-05 — Audit Logging Deficits
- **Definition:** The system has no (or inadequate) audit trail: administrative actions, PII access/modification, authentication events, and permission changes are not logged — or logs are unstructured, tamperable, or not retained.
- **Why it signals obsolescence:** Audit logs are how you learn what happened — required for every serious incident, every compliance framework (SOC2, HIPAA, GDPR' accountability), and every post-mortem. Their absence means the system is un-forensic: if (when) something happens, you will not know the who/when/what. Modern systems log events as a first-class, structured, append-only concern.
- **Where it manifests:** Admin endpoints with no logging, no auth-event log, PII read/modify paths without access records, logs that get wiped on deploy, unstructured ad-hoc `console.log`, no retention policy, no tamper protection.
- **Detection method:** Log/config audit — check log sinks, retention, and content; automation: review the auth module and admin APIs for audit statements; check audit trail survives redeploy (external sink vs. local fs); check log schema (structured JSON with event type, actor, target, timestamp, request ID); run an action and confirm it's traceable end-to-end.
- **Objective metric:** `# of admin/PII/auth events with audit logging`; `% of sensitive actions traceable end-to-end`; `log retention days`; `tamper protection present?`; `log format structured?`.
- **Yellow flag (warning):** Unstructured logs or missing request correlation IDs; partial coverage (some sensitive actions logged, some not). *(Rationale: warning — reconstruction is hard but possible.)*
- **Red flag (critical):** Zero audit trails for administrative access, PII modification, or authentication events. *(Rationale: you cannot investigate — regulatory and forensic dead-end.)*
- **Example symptom:** "After a blast-radius incident, the team tries to reconstruct who exported 40k customer records. The admin tool logs nothing; deploy containers wipe `/var/log`. 'We can't tell you who did it' is the honest answer."
- **Blast radius:** Incident forensics, regulatory non-compliance, breach liability, insider-threat detection, user-trust litigation.
- **Remediation playbook:** Quick win: add audit logging to the top admin/PII/auth paths with a structured schema, ship logs to an external durable sink, set retention. Structural fix: treat audit as a compliance requirement — append-only/crypto-chained where needed, centralized log platform, automated test asserting every sensitive action produces an audit event.
- **Gold standard / target state:** Every admin/PII/auth event logged structured (actor, action, target, time, request ID), durable, retained per policy, and tamper-evident; an automated coverage test exists.
- **Scoring guidance:** 3 = complete, structured, retained; 2 = partial coverage, unstructured; 1 = major gaps in sensitive paths; 0 = no audit trail at all.
- **Verify effort:** 🔶 ~2–4 h — config audit + end-to-end trace test.

### SEC-06 — Insecure Transitive Chains
- **Definition:** The vulnerability surface hides deep in the transitive dependency graph — chains of unmaintained or suspicious packages below the surface that could carry malware, or known vulnerable paths reachable only through indirect dependencies.
- **Why it signals obsolescence:** Deep scanning is the difference between "we checked the obvious" and "we actually know what we ship." Legacy codebases usually have legacy graphs (deep, unpruned, invisible) — and a deep, unmonitored graph is where the next SolarWinds/event-stream-class event happens. (Pairs with ECOS-06/ECOS-10.)
- **Where it manifests:** Lockfiles hundreds/thousands deep, dependency trees where the vulnerable package is 8 levels down, packages that appear to be maintained yet contain modified forks, deep chains into abandoned libs (ECOS-03), scanner reports with buried reachable paths.
- **Detection method:** Deep SCA — `osv-scanner --experimental-local-db`, `pip-audit -r`, `npm audit --all`, Socket.dev for provenance chain, Grype lockfile scanning, reachability analysis (Snyk Reachable, GitHub reachability). Trace each open CVE to the top-level packages that can trigger it; check depth and reachability. Also check vendored code for sub-scanning.
- **Objective metric:** `mean transitive depth of vulnerable packages`; `# of reachable vulnerabilities at depth > 5`; `% of graph from unmaintained packages`; `top-level producers of vulnerable chains`.
- **Yellow flag (warning):** Vulnerabilities only reachable through deep chains (depth > 5) into unmaintained packages, without likely exploit reachability. *(Rationale: warning — risk exists but is buried; still must be managed.)*
- **Red flag (critical):** Known malware/hijacked package confirmed in the lockfile, or a reachable critical vuln that only lives in the transitive graph and has no patch (see also ECOS-10). *(Rationale: the actual shipping software contains malicious or unpatchable code you didn't choose.)*
- **Example symptom:** "Grype reports a High-XSS reachable only via `webpack@4 → sass-loader → node-sass → nan → bindings` — a six-level chain into a package last published in 2019 with no fix. Patching it means killing a whole legacy toolchain."
- **Blast radius:** Unpatchable vulnerabilities, malware contamination, supply-chain incidents, audit credibility, compliance.
- **Remediation playbook:** Quick win: use tooling to map reachable chains to top-level packages, plan removals/forks of the top offenders, add deep scanning to CI. Structural fix: prune the graph (replace deep-chain producers), vendoring review, dependency budget (ECOS-06), provenance verification, and an incident runbook for "malicious package found."
- **Gold standard / target state:** Deep scanning in CI with reachability intelligence; zero malware; vulnerable chains mapped and justified; unmaintained chains trending to zero.
- **Scoring guidance:** 3 = deep-scan clean; 2 = deep-chain vulns non-reachable; 1 = reachable deep vuln below top 2 levels; 0 = malware/any-unpatchable in the shipping graph (G2-adjacent).
- **Verify effort:** 🔶 ~2–4 h — deep scanner run + chain mapping.

### SEC-07 — Patch Cadence & Update Workflow
- **Definition:** The org has no working patch pipeline — security updates arrive via occasional heroics rather than a continuous, automated, gated flow. Lockfiles sit stale, Dependabot/Renovate is off, patches wait for "the next release."
- **Why it signals obsolescence:** Patch cadence is the *process* that turns SEC-01's findings into fixes. Absent a cadence, every CVE is a project; present, it's a routine Tuesday. Its absence marks a maintenance model abandoned by modern practice (auto-update + CI-as-gate).
- **Where it manifests:** No Dependabot/Renovate, or the bot's PRs accumulate > 500 open, old lockfile dates, manual `docker build` on servers, "we batch patches once a year," security patches deferred for feature freezes, no staging for patch validation.
- **Detection method:** Automation audit — bot presence + PR age distribution, lockfile last-updated date, release-process gate (do patches require a full release train?), patch ticket SLAs, how long between a CVE report and a fix deploy (look at history).
- **Objective metric:** `median days to patch a High CVE`; `Dependabot/Renovate PR backlog`; `% of patches applied within SLA`; `lockfile freshness (days)`; `existence of automation`.
- **Yellow flag (warning):** Manual patch process, patches within 30–90 days, automation absent but SLA roughly met. *(Rationale: warning — it works, barely, and only because people carry it.)*
- **Red flag (critical):** No automation, patches routinely > 90 days or deferred for releases, or "we can't patch because the build breaks" (unpatched = systemic). *(Rationale: the pipeline is broken, so exposure accumulates structurally.)*
- **Example symptom:** "Dependabot has 640 open PRs from three years. Patching is 'a release-day thing.' Last critical CVE took 5 weeks: no staging, no tests for patch branches, and the 'patch' broke the auth flow."
- **Blast radius:** Exposure window, SEC-01 compounding, audit outcomes, security-team trust in engineering.
- **Remediation playbook:** Quick win: enable Dependabot/Renovate with auto-merge on green for patch/minor updates, act on the security-only PRs first. Structural fix: a scheduled patch lane (weekly security window, CI gates), environment-per-ticket to stage patches, measured SLA with an executive dashboard.
- **Gold standard / target state:** Patches automated, applied within SLA (Crit ≤ 7d, High ≤ 30d), CI validates every patch, zero manual patch heroics.
- **Scoring guidance:** 3 = automated + SLA met; 2 = manual but within 30–90 days; 1 = batch/heroic patching; 0 = no pipeline, systemic exposure.
- **Verify effort:** ⚡ ≤ 30 min — bot dashboard + lockfile dates.

### SEC-08 — Compliance Drift
- **Definition:** The system is out of alignment with the compliance frameworks it must meet (SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, or internal policy controls) — evidence collection is manual, control mapping is stale or nonexistent, and required safeguards (encryption in transit/at rest, data retention, right-to-erasure, attestation) are missing.
- **Why it signals obsolescence:** Compliance is a contract with the market — customers, regulators, insurers. Drift means the codebase is no longer *certifiable*, which blocks sales, renewals, and funding, and signals the security program itself is under-resourced (all SEC indicators correlate).
- **Where it manifests:** Missing encryption at rest, no data-retention/erasure flows (GDPR), controls without evidence (SOC2), audit findings closed as "accepted risk" en masse, no data classification, PII stored in unencrypted logs or denormalized blobs, outdated policy docs vs. actual behavior.
- **Detection method:** Control-mapping audit — inventory the required control set, verify each against implementation (encryption config, retention jobs, erasure endpoints, log retention, access reviews); check evidence-generation (is it automated or a manual spreadsheet?); review recent audit findings and acceptances. Tools: compliance scanners (e.g., CSPM/Vanta/Drata evidence), manual walkthrough.
- **Objective metric:** `% of required controls implemented + evidenced`; `# of controls with manual-only evidence`; `encryption-at-rest coverage %`; `retention/erasure automation %`; `# of 'accepted risk' audit findings`.
- **Yellow flag (warning):** Partial control mapping, manual evidence collection, a few accepted-risk findings, some unencrypted stores. *(Rationale: warning — manageable, but auditors will flag it.)*
- **Red flag (critical):** No mapping or evidence to required frameworks, no encryption at rest, no retention/erasure capability, or audit findings closed without remediation. *(Rationale: the system cannot be certified or defended — a business blocker.)*
- **Example symptom:** "A SOC2 renewal is 6 weeks out. The control evidence is a wiki link from 2021. PII lives in an unencrypted analytics DB. 'We'll note it as accepted risk' was the answer three quarters running."
- **Blast radius:** Sales/renewals, funding, insurance, regulatory fines, customer trust, breach liability.
- **Remediation playbook:** Quick win: map the top 10 required controls to evidence today, automate the biggest evidence gaps (logs, backups, review reports). Structural fix: continuous compliance automation (CSPM tools, evidence pipelines), close the accepted-risk list to a bounded, tracked set, encryption at rest everywhere, retention/erasure as engineering backlog items.
- **Gold standard / target state:** Controls auto-evidenced, near-zero accepted-risk, encryption + retention/erasure automated, audit-ready at any moment.
- **Scoring guidance:** 3 = mapped + auto-evidenced; 2 = partial mapping, manual evidence; 1 = no evidence automation, accepted risks growing; 0 = unmapable to frameworks, no core safeguards.
- **Verify effort:** 🔶 ~2–4 h — control inventory + evidence check.

---

## Deep-dive indicators

### SEC-09 — Input Robustness & Fuzzing
- **Definition:** The system parses untrusted input (uploads, formats, network payloads, configs) with no fuzzing coverage, no input-validation hardening, and no crash-memory-safety testing — a hand-maintained "we trust the data" posture.
- **Why it signals obsolescence:** Fuzzing is how the modern era finds memory and parser bugs; it's standard practice in any security-mature org. Its absence is a direct vulnerability-miss signal for anything that ingests foreign bytes — and parsers are where remote code execution lives.
- **Where it manifests:** File-upload endpoints, document viewers, invoice/PDF/XML/JSON/CSV parsing, archive extraction, image processing, serialization boundaries — with no fuzz harnesses (*fuzz* targets), no `-fsanitize` builds, no structured-input validation.
- **Detection method:** Fuzz harness inventory (AFL, libFuzzer, Jazzer, `cargo-fuzz`, `go fuzz`, `oss-fuzz` presence); memory-checker builds (ASan/UBSan) existence; run a short fuzz campaign on the top parser (e.g., `libFuzzer` for 30 min) and measure crashes/hangs; inspect input-validation layers for fuzz-blocking (canary that rejects early).
- **Objective metric:** `# of parsers with fuzz harnesses / total untrusted parsers`; `crashes found in a timed campaign`; `memory-safety build in CI?`; `% of input paths with length/type/structure validation`.
- **Yellow flag (warning):** Sanitizer builds and some validation exist, but no fuzz harnesses; a couple of untrusted parsers unhardened. *(Rationale: warning — the tooling farm is half-seeded.)*
- **Red flag (critical):** Untrusted-input parsers (especially any memory-unsafe language or complex format) with no fuzzing *and* no validation hardening — or known parser CVEs unaddressed. *(Rationale: an unguarded byte-receiving boundary is a standing RCE/buffer-overflow invitation.)*
- **Example symptom:** "The legacy upload service unzips customer files in Python 3.6 with a patched-to-pieces third-party extractor. Five minutes of libFuzzer on the equivalent local fork finds a path-traversal crash on the second corpus file."
- **Blast radius:** RCE/buffer-overflow risk, file-based compromise, supply-chain contamination, incident severity ceiling.
- **Remediation playbook:** Quick win: stand up fuzz harnesses for the top 3 untrusted parsers, run sanitizer builds, harden validation at those boundaries (limits, types, structure). Structural fix: fuzz-in-CI for parser-adjacent code, migrate memory-unsafe parsers, input-validation as a platform concern, adversarial corpus maintenance.
- **Gold standard / target state:** Every untrusted parser fuzzed in CI with sanitizers, zero standing crashes, validation layers reject early and clearly.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = fuzzed + sanitized; 2 = sanitizers, no harnesses; 1 = unhardened parsers in peripheral; 0 = unguarded untrusted-input parsers in core.
- **Verify effort:** 🔷 ~1–2 days — harness setup + timed campaign.

### SEC-10 — Security Testing in CI
- **Definition:** Security tooling (SAST, secret scanning, dependency scanning, container scanning, and periodic DAST/pentest) is absent from CI or performed ad hoc — meaning security is found downstream, by incidents and audits, rather than caught at merge time.
- **Why it signals obsolescence:** "Shift-left" security (gates in CI) is the modern baseline. A codebase without it is relying on human reviewers for security, which — as every breach analysis shows — is not a strategy. This indicator measures whether the *process* is modern even when today's findings are clean.
- **Where it manifests:** CI with no SAST job (Semgrep/CodeQL/SonarQube), no secret scan step, no dependency scan (or run only weekly), no container image scan, no `trivy` step, pentests done "when someone remembers," no threat modelling artifacts.
- **Detection method:** CI config audit — inventory security jobs; check they fail the build (not comment-only) and scan all diff contexts; check secret scan covers history; check container/image scanning on every build; check DAST/pentest cadence records; verify findings have an owner+tracking (not just printed).
- **Objective metric:** `# of security job categories in CI (SAST, secrets, deps, image, DAST)`; `% of recent PRs covered by those jobs`; `mean time to remediate a CI-found finding`; `pentest/DAST cadence (months)`.
- **Yellow flag (warning):** One or two scan types in CI (e.g., secrets + deps), SAST missing or comment-only, DAST quarterly at best. *(Rationale: warning — you catch the cheap stuff, not everything.)*
- **Red flag (critical):** No security tooling in CI at all, or scans exist but can't fail the build (always green), or findings have no owner/tracking. *(Rationale: every security defect ships to the field and is discovered by the next user or attacker.)*
- **Example symptom:** "The only 'security scan' is a monthly Trivy run the SRE pastes into a ticket. CodeQL was half-configured three years ago and 'still isn't blocking.' A findbug-grade credential leak merged last week wasn't caught by anything."
- **Blast radius:** Defect-in-field rate for security, audit outcomes, breach likelihood, remediation cost (security bugs found late cost 100×).
- **Remediation playbook:** Quick win: add Semgrep/CodeQL failing gates, secret scan on history + CI, TRIVY on images — this week. Structural fix: a security-as-quality pipeline (SAST, deps, secrets, container, DAST on staging, threat modelling for new features), a findings tracking loop (owner, SLA, retest), and a hard "no gate-less merge" rule.
- **Gold standard / target state:** Five scan categories failing in CI, findings tracked to closure within SLA, DAST regularly scheduled, threat modelling on all new boundaries.
- **Scoring guidance:** (deep-dive — no rubric row) 3 = full toolchain gating; 2 = partial toolchain, no block; 1 = minimal coverage, no tracking; 0 = zero security tooling in CI.
- **Verify effort:** 🔷 ~1–2 days — CI audit + coverage analysis.