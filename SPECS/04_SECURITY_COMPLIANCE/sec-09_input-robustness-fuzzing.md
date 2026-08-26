# SEC-09 — Input Robustness & Fuzzing — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** — presence-only (tier arbitrated; encyc said B·unknown) |
| v1 flag | YES (presence-only caveat mandatory) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔷 human (campaign) · engine: harness inventory |
| Thresholds & 0–3 criteria | see encyclopedia §SEC-09 |

## 1. Inputs

- **Planes:** static-src
- **Tools:** exhaustive-tree matcher pack: fuzz targets (`*_fuzz*`, `fuzz/`, `oss-fuzz/`, `cargo-fuzz`, `go-fuzz` build tags, `libFuzzer`/`Jazzer`/`AFL` refs), sanitizer build configs (`-fsanitize` in build files, `CFLAGS` in CI, `ASAN_OPTIONS` in workflows)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: repo has no input-parsing surface class (no parsers/decoders/protocol handlers detected)` → clause-b N/A with the detector's evidence listed.

## 2. Detection recipe

1. Inventory fuzz-harness files/targets over the enumerated tree.
2. Detect sanitizer configuration in build + CI files.
3. Continuous-fuzzing signal: `oss-fuzz` integration, scheduled fuzz workflow.
4. Campaign execution is out of v1 scope (execution plane) → "what it takes" emission covers it.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"sec09": {
  "harnesses": [{"path": "fuzz/fuzz_parse.c", "engine": "libFuzzer"}],
  "sanitizers_in_build": true,
  "continuous_fuzzing": {"oss_fuzz": false, "scheduled_workflow": false},
  "parser_surface_detected": ["json", "yaml", "http"]}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                  # inventory is a fact; scored as presence-only
estimated_when: parser-surface detection uncertain -> applicability ambiguous   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        no parsing surface (clause-b, evidence recorded)
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

## 5. Score mapping (predicates)

Criteria: see encyclopedia §SEC-09.

- `3`: harnesses ∧ sanitizers ∧ continuous fuzzing
- `2`: harnesses present, sanitizers partial
- `1`: sanitizers only ∨ single stale harness
- `0`: parsing surface exists ∧ zero harness/sanitizer evidence anywhere

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `fast`
- Presence-only rule: report copy must carry "presence measured; campaign strength unverified" per `PLANS/04` §5 style caveats

## 8. Evidence string

```
evidence: "fuzz-inventory: {k} harnesses ({engines}); sanitizers={bool}; continuous={bool}; surface={classes}"
```

## 9. Scope/overlaps echo

Fuzz-readiness posture; actual injection vulnerabilities are SEC-03/04 rows.
