# ARCH-04 — Dead & Orphaned Code — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into ARCH category % |
| Verify effort | ⚡ human · engine: tool run + git archaeology |
| Thresholds & 0–3 criteria | see encyclopedia §ARCH-04 |

## 1. Inputs

- **Planes:** static-src + git
- **Tools:** `knip >= 5` (JS/TS exports/deps/files), `vulture >= 2` (Python), `go vet`-class unused via `golangci-lint` config presence (Go — detection of its CI usage only; we run `staticcheck --unused` equivalent parse? No: run nothing repo-side; use golangci config presence as proxy → estimated), generic export-reference matcher
- **Rate-cost:** none
- **Ecosystems:** JS/TS (full) · Python (full) · Go/Java (heuristic)
- **Applicability:** never N/A for scored repos (dead code % is defined over whatever exists); `unknown_when: no supported language`.

## 2. Detection recipe

1. Run dead-code detector per ecosystem (config-only).
2. Feature-flag inventory: constant-condition patterns (`if True:`, `flag &&` with const literal), flags stuck per git blame age.
3. Unreferenced-endpoint probe: route definitions not reachable from any client/test/config reference (presence-only hint).
4. Compute `% unreferenced` over exported symbols; join to core-path set.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"arch04": {
  "symbols_total": 3120, "unreferenced_pct": 12.8,
  "stuck_flags": [{"name": "checkoutV2", "age_days": 420, "value": true}],
  "orphan_endpoints": [{"route": "/admin/legacy-export", "refs_found": 0}]}}
```

## 4. Statusing rules

```yaml
measured_when:  native detector ran clean
estimated_when: heuristic-only ecosystem (Go/Java)          # clamp [1,2], confidence low
unknown_when:   no supported language parsed
na_when:        never (see Inputs)
clamp:          [1,2]
confidence:     medium full / low heuristic
scope_limited:  monorepo workspace truncation -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Y/R values (10–20% / >20%, flag-age 6–12mo): see encyclopedia §ARCH-04.

- `3`: `unreferenced_pct < Y_PCT` ∧ no stuck flags ∧ no orphans
- `2`: Yellow band, peripheral only
- `1`: `> R_PCT` ∨ orphan endpoints in isolated services
- `0`: orphan endpoints resolving on core/auth paths ∨ two-quarter growth trend (needs scan history; v1 single-scan omits trend)

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `slow-dissolvable` (dissolve → direct-deps+exports subset + scope-limited)
- Dynamic-dispatch-heavy languages inflate false positives → confidence low noted

## 8. Evidence string

```
evidence: "knip {ver}: {p}% of {n} symbols unreferenced; stuck flags {list}; orphans {list}"
```

## 9. Scope/overlaps echo

Unreferenced code and flags only; live-but-zero-traffic exposure cross-references API traffic without duplicating it.
