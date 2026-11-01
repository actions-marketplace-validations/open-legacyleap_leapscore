# SEC-09 — Input Robustness & Fuzzing

> **Category:** [Security, Compliance & Vulnerability](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | SEC-09 |
| Name | Input Robustness & Fuzzing |
| Category | SEC — Security, Compliance & Vulnerability |
| Engine tier | B |
| Default status | unknown |
| v1 flag | YES (presence-only caveat mandatory) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into SEC category % |
| Verify effort | 🔷 ~1–2 days — harness setup + timed campaign. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** The system parses untrusted input (uploads, formats, network payloads, configs) with no fuzzing coverage, no input-validation hardening, and no crash-memory-safety testing — a hand-maintained "we trust the data" posture.
- **Why it signals obsolescence:** Fuzzing is how the modern era finds memory and parser bugs; it's standard practice in any security-mature org. Its absence is a direct vulnerability-miss signal for anything that ingests foreign bytes — and parsers are where remote code execution lives.
- **Where it manifests:** File-upload endpoints, document viewers, invoice/PDF/XML/JSON/CSV parsing, archive extraction, image processing, serialization boundaries — with no fuzz harnesses (*fuzz* targets), no `-fsanitize` builds, no structured-input validation.
- **Objective metric:** `# of parsers with fuzz harnesses / total untrusted parsers`; `crashes found in a timed campaign`; `memory-safety build in CI?`; `% of input paths with length/type/structure validation`.
- **Yellow flag (warning):** Sanitizer builds and some validation exist, but no fuzz harnesses; a couple of untrusted parsers unhardened. *(Rationale: warning — the tooling farm is half-seeded.)*
- **Red flag (critical):** Untrusted-input parsers (especially any memory-unsafe language or complex format) with no fuzzing *and* no validation hardening — or known parser CVEs unaddressed. *(Rationale: an unguarded byte-receiving boundary is a standing RCE/buffer-overflow invitation.)*
- **Example symptom:** "The legacy upload service unzips customer files in Python 3.6 with a patched-to-pieces third-party extractor. Five minutes of libFuzzer on the equivalent local fork finds a path-traversal crash on the second corpus file."
- **Blast radius:** RCE/buffer-overflow risk, file-based compromise, supply-chain contamination, incident severity ceiling.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** (deep-dive — folds into the category when run) 3 = fuzzed + sanitized; 2 = sanitizers, no harnesses; 1 = unhardened parsers in peripheral; 0 = unguarded untrusted-input parsers in core.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: stand up fuzz harnesses for the top 3 untrusted parsers, run sanitizer builds, harden validation at those boundaries (limits, types, structure). Structural fix: fuzz-in-CI for parser-adjacent code, migrate memory-unsafe parsers, input-validation as a platform concern, adversarial corpus maintenance.
- **Gold standard / target state:** Every untrusted parser fuzzed in CI with sanitizers, zero standing crashes, validation layers reject early and clearly.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src
- **Tools:** exhaustive-tree matcher pack: fuzz targets (`*_fuzz*`, `fuzz/`, `oss-fuzz/`, `cargo-fuzz`, `go-fuzz` build tags, `libFuzzer`/`Jazzer`/`AFL` refs), sanitizer build configs (`-fsanitize` in build files, `CFLAGS` in CI, `ASAN_OPTIONS` in workflows)
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** `na_when: repo has no input-parsing surface class (no parsers/decoders/protocol handlers detected)` → clause-b N/A with the detector's evidence listed.

## 6. Detection recipe

- **Detection method:** Fuzz harness inventory (AFL, libFuzzer, Jazzer, `cargo-fuzz`, `go fuzz`, `oss-fuzz` presence); memory-checker builds (ASan/UBSan) existence; run a short fuzz campaign on the top parser (e.g., `libFuzzer` for 30 min) and measure crashes/hangs; inspect input-validation layers for fuzz-blocking (canary that rejects early).

1. Inventory fuzz-harness files/targets over the enumerated tree.
2. Detect sanitizer configuration in build + CI files.
3. Continuous-fuzzing signal: `oss-fuzz` integration, scheduled fuzz workflow.
4. Campaign execution is out of v1 scope (execution plane) → "what it takes" emission covers it.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"sec09": {
  "harnesses": [{"path": "fuzz/fuzz_parse.c", "engine": "libFuzzer"}],
  "sanitizers_in_build": true,
  "continuous_fuzzing": {"oss_fuzz": false, "scheduled_workflow": false},
  "parser_surface_detected": ["json", "yaml", "http"]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                  # inventory is a fact; scored as presence-only
estimated_when: parser-surface detection uncertain -> applicability ambiguous   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        no parsing surface (clause-b, evidence recorded)
clamp:          [1,2]
confidence:     medium
scope_limited:  none typical
```

### Score mapping predicates

Criteria: see §3.

- `3`: harnesses ∧ sanitizers ∧ continuous fuzzing
- `2`: harnesses present, sanitizers partial
- `1`: sanitizers only ∨ single stale harness
- `0`: parsing surface exists ∧ zero harness/sanitizer evidence anywhere

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`
- Presence-only rule: report copy must carry "presence measured; campaign strength unverified" per the catalog conventions style caveats

## 10. Evidence and output

### Evidence string

```
evidence: "fuzz-inventory: {k} harnesses ({engines}); sanitizers={bool}; continuous={bool}; surface={classes}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Fuzz-readiness posture; actual injection vulnerabilities are SEC-03/04 rows.
