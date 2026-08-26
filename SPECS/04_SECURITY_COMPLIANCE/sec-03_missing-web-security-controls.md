# SEC-03 — Missing Web Security Controls — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | C · **unknown** (tier arbitrated; encyc said B — every signal needs a deployed target) |
| v1 flag | NO |
| Gates fed | **G4** (with SEC-04) — as `needs-verification` in v1, never `proven` from URL |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔶–🔷 human/DAST |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-03 |

## 1. Inputs

- None available from URL + static clone. DAST/headers/TLS all require a running deployment.

## 2. Detection recipe (v2/deep-scan sketch)

1. DAST (ZAP/Nuclei baseline) against a staging target supplied by the repo owner (M&A flow).
2. Header/TLS scan (`testssl.sh`, securityheaders.com API) against the same.
3. SAST injection rule-packs (Semgrep) are NOT this row's proxy — they overlap SEC-04's grep tier and G4 handling; cross-reference only.

**v1 behavior:** ships `unknown` + emission text; feeds G4 `needs-verification`.

## 3. Fact schema (v1)

```json
{"sec03": {"status": "unknown",
            "reason": "web controls observable only on a deployed target",
            "g4_state": "needs-verification"}}
```

## 4. Statusing rules

```yaml
measured_when:  never from URL
estimated_when: never                            # header greps in code prove intent, not enforcement
unknown_when:   always in v1
clamp:          n/a
confidence:     n/a
```

## 5. Score mapping

None in v1.

## 6. Gate hooks (G4)

Always contributes `needs-verification` in v1 (top deep-dive item). `proven` only via v2 DAST evidence.

## 7. Failure & budget semantics

n/a v1.

## 8. Evidence string

```
emission: "unknown — needs staging target for headers/TLS/DAST (deep scan); G4 pending that check"
```

## 9. Scope/overlaps echo

Deployed-app control surface (headers/TLS/OWASP-reachable); auth-flow weaknesses are SEC-04.
