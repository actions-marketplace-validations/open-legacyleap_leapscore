# SEC-03 — Missing Web Security Controls

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-03 |
| Name | Missing Web Security Controls |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | B |
| Default status | estimated |
| v1 flag | NO |
| Gates fed | **G4** (with SEC-04) — as `needs-verification` in v1, never `proven` from URL |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — DAST/SAST run + header scan. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The application is missing modern transport/presentation security controls — TLS configuration outdated (TLS 1.0/1.1), missing security headers (CSP, HSTS, X-Content-Type-Options, frame options), no input validation/sanitization at entry points, no output encoding — and OWASP Top-10 classes (SQLi, XSS, RCE, SSRF) are reachable in application flows.
- **Why it signals obsolescence:** Web security controls are the *price of entry* for a modern system — they're free to add and non-negotiable by default in any modern framework. Their absence marks a codebase that predates the security education of the last decade. Reachable OWASP Top-10 classes in core flows is a gate (G4).
- **Where it manifests:** Response headers (curl `-I`), TLS scan (ssllabs, `testssl.sh`), raw SQL string concatenation, unsanitized user input into queries/renderers, `innerHTML` with user data, unvalidated file uploads, SSRF-able fetch targets, deserialization of untrusted input.
- **Objective metric:** `# of reachable Top-10 findings (SQLi/RCE/XSS/SSRF break glass)`; `security header coverage %`; `TLS version/protocol grade`; `# of input paths without validation`.
- **Yellow flag (warning):** Missing headers, outdated TLS (1.1 tolerated), input validation incomplete on non-critical paths. *(Rationale: hardening gaps — real but not immediately exploitable at scale.)*
- **Red flag (critical):** Reachable SQLi/RCE/broken auth/SSRF in core flows, or no input validation at all at any entry point (triggers **G4**). *(Rationale: actively exploitable vulnerability classes in the software's purpose — a breach in training.)*
- **Example symptom:** "ZAP finds a blind SQLi in the search endpoint built by string concatenation ('the old codebase was like that'). The TLS config allows 1.0. Observatory scores the headers 20/100. All of it is 'legacy we've been meaning to fix.'"
- **Blast radius:** Data breach, regulatory action, customer trust, insurance, sales security reviews.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = no findings, A grades; 2 = hardening gaps outside core; 1 = reachable finding in isolated path; 0 = reachable Top-10 in core (G4).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: enable modern headers (HSTS/CSP via middleware), upgrade TLS, fix the top reachable injection points with parameterized queries and validation. Structural fix: framework defaults (most modern frameworks secure headers by default — upgrade), SAST+DAST in CI, input validation at every entry, an injection-class bug ban (semantic gate).
- **Gold standard / target state:** A+ header/TLS grades, zero reachable Top-10 findings, SAST+DAST wired into CI, validation at all boundaries.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- None available from URL + static clone. DAST/headers/TLS all require a running deployment.

## 6. Detection recipe

- **Detection method:** DAST (OWASP ZAP, Burp, Nuclei) against a staging env, SAST (Semgrep, SonarQube, CodeQL rule packs) for injection patterns, header/TLS scanning (`testssl.sh`, Mozilla Observatory, `securityheaders.com`), manual review of input-handling paths. Map findings to OWASP Top-10 categories and reachability.

1. DAST (ZAP/Nuclei baseline) against a staging target supplied by the repo owner (M&A flow).
2. Header/TLS scan (`testssl.sh`, securityheaders.com API) against the same.
3. SAST injection rule-packs (Semgrep) are NOT this row's proxy — they overlap SEC-04's grep tier and G4 handling; cross-reference only.

**v1 behavior:** ships `unknown` + emission text; feeds G4 `needs-verification`.

## 7. Fact schema

```json
{"sec03": {"status": "unknown",
            "reason": "web controls observable only on a deployed target",
            "g4_state": "needs-verification"}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never from URL
estimated_when: never                            # header greps in code prove intent, not enforcement
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

### Score mapping predicates

None in v1.

## 9. Gate, failure, and budget behavior

### Gate hooks

Always contributes `needs-verification` in v1 (top deep-dive item). `proven` only via v2 DAST evidence.

### Failure and budget semantics

n/a v1.

## 10. Evidence and output

### Evidence string

```
emission: "unknown — needs staging target for headers/TLS/DAST (deep scan); G4 pending that check"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Deployed-app control surface (headers/TLS/OWASP-reachable); auth-flow weaknesses are SEC-04.
