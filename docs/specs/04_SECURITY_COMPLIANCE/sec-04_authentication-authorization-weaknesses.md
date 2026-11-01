# SEC-04 — Authentication & Authorization Weaknesses — Implementation Spec

> **Authority:** This file defines the SEC-04 implementation contract. The [SEC rubric category](../../rubric/04_SECURITY_COMPLIANCE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (grep-class static proxies only; encyc said unknown, matrix C·estimated) |
| v1 flag | PART (estimated-only; low-confidence label mandatory) |
| Gates fed | **G4** (with SEC-03) |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶 human pentest · engine: static proxy sweep |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-04 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** matcher packs: default/weak credential literals (`admin/admin`, `password = "..."` non-secret-shaped), client-side-only role checks (`isAdmin` in FE bundles guarding routes), missing-middleware route enumeration (shared with ARCH-12), session-config smells (`maxAge: null`, `secure: false`, `httpOnly: false`), hardcoded bypass flags (`DEBUG=True`, `SKIP_AUTH`)
- **Rate-cost:** none
- **Ecosystems:** JS/TS · Python · Java · Go (pack density varies)
- **Applicability:** `na_when: no auth-adjacent code or routes detected` (pure CLI tool, clause-b).

## 2. Detection recipe

1. Route enumeration (ARCH-12 shared parser); middleware-chain coverage per route.
2. Run weakness matchers over handlers + FE guard code.
3. Session/auth config audit from framework config files.
4. All hits joined to core-path set; counts recorded with `signal_strength: weak` by rule.

Preconditions: route/config parse.

## 3. Fact schema

```json
{"sec04": {
  "routes_total": 84, "routes_without_server_middleware": 9,
  "client_side_only_role_guards": 4,
  "session_config_flags": {"insecure_cookie": true},
  "default_cred_literals": [],
  "debug_bypass_hits": [{"file": "app.py", "pattern": "if DEBUG: skip_auth()"}]}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # proxies cannot prove exploitability
estimated_when: >=2 matcher classes ran        # clamp [1,2]; confidence LOW always (rule)
unknown_when:   no parseable auth surface
na_when:        applicability fired
clamp:          [1,2]
confidence:     low by definition (04 §5: "label low")
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §SEC-04. Estimated ⇒ score ∈ {1,2}:

- `2`: isolated smell sites, none on core/auth paths
- `1`: any hit class touching core-route set ∨ multiple classes firing
- `3`/`0` unreachable by construction

## 6. Gate hooks (G4)

Never fires G4 `proven` from this row alone (static proxies can't prove reachability). Contributes to G4 `needs-verification`; escalates the emission priority when hits touch core routes. G4 proven requires v2 DAST/pentest evidence.

## 7. Failure & budget semantics

- Budget class: `fast`
- Framework unrecognized → middleware coverage unknown → that probe dropped, others stand

## 8. Evidence string

```
basis: "auth-proxy: {r}/{n} routes lack server middleware; {c} client-only guards; flags {list} [low confidence]"
```

## 9. Scope/overlaps echo

AuthN/AuthZ flow weaknesses; duplicated cross-cutting auth infrastructure is ARCH-12, deployed-control surface SEC-03.
