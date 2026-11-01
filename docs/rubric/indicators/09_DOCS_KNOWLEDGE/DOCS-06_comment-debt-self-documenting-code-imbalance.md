# DOCS-06 — Comment Debt & Self-Documenting Code Imbalance

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-06. Edit this file; the legacy path [docs-06_comment-debt-self-documenting-code-imbalance.md](../../../specs/09_DOCS_KNOWLEDGE/docs-06_comment-debt-self-documenting-code-imbalance.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-06_comment-debt-self-documenting-code-imbalance.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-06 |
| Name | Comment Debt & Self-Documenting Code Imbalance |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | A |
| Default status | estimated |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — sample review + grep/TODO-age. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Code comments are misleading, obsolete, or restate the obvious ("increment i"), while intent, invariants, and "why not X" are undocumented — OR the code is so cryptic that comments exist as apology. Either way, the code's *intent* is not readable from the code itself.
- **Why it signals obsolescence:** Comment debt is the texture of maintenance neglect: comments that lie are worse than none (they train readers to skip them), and code that can't explain itself passes its meaning down as folklore. Modern practice is self-documenting code (clear names, small functions, explicit intent) + honest "why" comments only where needed. (This is the micro-level of the whole knowledge problem.)
- **Where it manifests:** Comments saying `// TODO: fix this` 5 years old, comments that contradict the next line, copy-pasted comments, naming like `x2`, `doStuff`, magic numbers with no explanation, dead comment blocks, no "why" comments near non-obvious invariants.
- **Objective metric:** `TODO/FIXME age distribution (median age)`; `misleading-comment ratio (sampled)`; `self-documenting score (naming + small functions)`; `% of comments that are "why" vs. "what"`.
- **Yellow flag (warning):** TODO-rot present, some cryptic naming, some redundant/paraphrase comments. *(Rationale: warning — texture is degrading, readability is paying.)*
- **Red flag (critical):** Code is cryptic and comments are required to decode it — or comments actively contradict the code, and the standard is "trust the comment? trust the code? flip a coin." *(Rationale: the code cannot be read as truth — it must be decoded, which is why fixes are always risky.)*
- **Example symptom:** "`// Do not change this function` — nobody knows why, the comment's 8 years old, and the function is called `fix()` with args `a` and `b`. The reader has a choice of three falsehoods and one mystery."
- **Blast radius:** Fix risk (misreading), onboarding, review quality, refactor safety, tribal knowledge (DOCS-05) — comments are the first sudo-documentation people trust.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = self-documenting, honest comments; 2 = TODOs + paraphrase rot; 1 = cryptic + misleading mix; 0 = comments are the only decoder and/or they lie.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: kill the top 20 misleading/obsolete comments (fix or delete), resolve/add justification for the oldest TODOs, rename the worst identifiers. Structural fix: self-documenting-code standards in review (naming, small functions), "why" comments for invariants, comment lint (TODO age alarm), and a "readability" gate on the module most touched on-call.
- **Gold standard / target state:** Code reads like prose (names carry intent), comments exist only for true "why", TODO-rot is gone, and a reader can trust line 1 to mean line 1.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** git + static-src
- **Tools:** TODO/FIXME/XXX/HACK marker grep with `git blame -L` age extraction; comment-density ratio per module (comments/LOC); naming-quality heuristics (identifier entropy, single-letter density in core modules) as weak signals
- **Rate-cost:** none
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Sample-based review — read 200–500 lines of each critical module: are names self-explanatory? Do comments explain "why" or just paraphrase "what"? Grep for TODO/FIXME/XXX/HACK and check age (git blames their introduction), misleading-comment ratio (does comment match behavior?), and naming quality (identifier length/verb-noun check).

1. Marker inventory: count + per-marker age distribution.
2. Density ratio per module; core-path join.
3. "Why vs what" comment classification is LLM/heuristic territory → recorded only as sampled basis text in deep mode; v1 keeps counts+age.
4. Misleading-comment detection requires reading → emission text.

Preconditions: history for blame ages.

## 7. Fact schema

```json
{"docs06": {
  "markers_total": 214,
  "aged_markers_over_year": 88,
  "comment_ratio_core": 0.04,
  "worst_files": [{"file": "core/pricing.py", "todos": 23}]}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # imbalance judgment is inferential
estimated_when: >=1 probe class ran            # clamp [1,2]; confidence medium when blame ages complete
unknown_when:   tree unparseable
na_when:        never
clamp:          [1,2]
confidence:     medium
scope_limited:  blame unavailable -> counts-only, confidence low
```

### Score mapping predicates

Y/R values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: markers present, minority aged, density not pathological in core
- `1`: aged-marker pile-up on core paths ∨ near-zero comment ratio ∧ opaque naming signals in core
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `fast`

## 10. Evidence and output

### Evidence string

```
basis: "comment-debt: {n} TODO-class ({a} >1y); core comment-ratio {p}%; worst {file}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Comment/naming hygiene; dead code those comments often mark is ARCH-04.
