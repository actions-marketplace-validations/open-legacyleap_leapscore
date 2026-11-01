# SEC-04 — Authentication & Authorization Weaknesses

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-04 |
| Name | Authentication & Authorization Weaknesses |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | B |
| Default status | unknown |
| v1 flag | PART (estimated-only; low-confidence label mandatory) |
| Gates fed | **G4** (with SEC-03) |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 ~2–4 h — route audit + session/cred review. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Weak or missing authN/authZ: default credentials, no auth on admin/internal endpoints, session flaws (predictable tokens, no expiry/rotation), broken password policy, missing MFA on privileged access, coarse or absent role-based access control, broken authorization checks (IDOR).
- **Why it signals obsolescence:** Modern systems treat auth as infrastructure (OIDC/SAML SSO, MFA, policy engines). A codebase rolling its own sessions with a hand-rolled token scheme, or protecting admin paths by convention, is an era artifact — and the results are directly exploitable (part of G4).
- **Where it manifests:** Default creds (`admin/admin`) in setup scripts, session tokens as mutable cookies, no expiry/rotation, `isAdmin` checked on the client, authorization checked on the UI not the server, no MFA anywhere (especially admin), homegrown JWT without verification of `alg`, IDOR (fetching by id without ownership check).
- **Objective metric:** `# of endpoints without auth`; `# of admin paths unauthenticated`; ``isAdmin` client-side checks count`; `session max-age / rotation conformance`; `MFA coverage % on privileged roles`.
- **Yellow flag (warning):** Weak session policy (long expiry, no rotation), coarse RBAC (all-or-nothing admin), no MFA on some privileged paths, some IDOR-able endpoints. *(Rationale: real weaknesses under the "still auth'd" threshold.)*
- **Red flag (critical):** Default/known credentials, unauthenticated admin/internal paths, org-level broken authN (session hijackable), or authorization enforced only client-side in core flows. *(Rationale: the barrier either doesn't exist or is client-side theater.)*
- **Example symptom:** "An internal tool has `admin/admin` in its Dockerfile 'for local use' — and it's exposed via the load balancer. A pentest logs in with the default, then lists every customer's records because authorization is a client-side flag."
- **Blast radius:** Complete account/data compromise, regulatory action, downstream customer breaches, trust collapse.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = managed identity + enforced authz; 2 = weakness in non-critical areas; 1 = broken control in an isolated service; 0 = default creds / unauthorized admin / client-side-only (G4).

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: kill default creds, add auth + server-side authorization to every endpoint (route registry), enable MFA on privileged roles, fix the top IDORs. Structural fix: move to managed identity (SSO/OIDC, platform IAM), policy-based authorization (OPA/AWS IAM/ABAC), automated authz tests (walk every route asserting enforcement), session best practices.
- **Gold standard / target state:** All endpoints server-side auth'd and authz'd, MFA everywhere privileged, managed SSO + policy engine, authz coverage test in CI.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** matcher packs: default/weak credential literals (`admin/admin`, `password = "..."` non-secret-shaped), client-side-only role checks (`isAdmin` in FE bundles guarding routes), missing-middleware route enumeration (shared with ARCH-12), session-config smells (`maxAge: null`, `secure: false`, `httpOnly: false`), hardcoded bypass flags (`DEBUG=True`, `SKIP_AUTH`)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go (pack density varies)
- **Applicability:** `na_when: no auth-adjacent code or routes detected` (pure CLI tool, clause-b).

## 6. Detection recipe

- **Detection method:** Security review (pentest-style) of auth flows, SAST rules (broken access control), manual walk of admin/internal endpoints with auth stripped, session inspection (token predictability/expiry), OWASP ZAP "forced browsing," check for client-side-only authorization, IDOR probes on object-id endpoints.

1. Route enumeration (ARCH-12 shared parser); middleware-chain coverage per route.
2. Run weakness matchers over handlers + FE guard code.
3. Session/auth config audit from framework config files.
4. All hits joined to core-path set; counts recorded with `signal_strength: weak` by rule.

Preconditions: route/config parse.

## 7. Fact schema

```json
{"sec04": {
  "routes_total": 84, "routes_without_server_middleware": 9,
  "client_side_only_role_guards": 4,
  "session_config_flags": {"insecure_cookie": true},
  "default_cred_literals": [],
  "debug_bypass_hits": [{"file": "app.py", "pattern": "if DEBUG: skip_auth()"}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # proxies cannot prove exploitability
estimated_when: >=2 matcher classes ran        # clamp [1,2]; confidence LOW always (rule)
unknown_when:   no parseable auth surface
na_when:        applicability fired
clamp:          [1,2]
confidence:     low by definition (04 §5: "label low")
```

### Score mapping predicates

Criteria: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: isolated smell sites, none on core/auth paths
- `1`: any hit class touching core-route set ∨ multiple classes firing
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

Never fires G4 `proven` from this row alone (static proxies can't prove reachability). Contributes to G4 `needs-verification`; escalates the emission priority when hits touch core routes. G4 proven requires v2 DAST/pentest evidence.

### Failure and budget semantics

- Budget class: `fast`
- Framework unrecognized → middleware coverage unknown → that probe dropped, others stand

## 10. Evidence and output

### Evidence string

```
basis: "auth-proxy: {r}/{n} routes lack server middleware; {c} client-only guards; flags {list} [low confidence]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

AuthN/AuthZ flow weaknesses; duplicated cross-cutting auth infrastructure is ARCH-12, deployed-control surface SEC-03.
