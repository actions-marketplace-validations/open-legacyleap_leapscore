# DOCS-08 — No Release Communication / Changelog — Implementation Spec

> **Authority:** This file defines the DOCS-08 implementation contract. The [DOCS rubric category](../../rubric/09_DOCS_KNOWLEDGE.md) owns its definition, thresholds, and scoring criteria; [`docs/specs/README.md`](../README.md) defines the normative cross-cutting conventions.

## 0. Identity

| field | value |
|---|---|
| Tier / default status | A · **measured** (tier arbitrated; encyc said B) |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | ⚡ human · engine: changelog + releases API audit |
| Thresholds & 0–3 criteria | see encyclopedia §DOCS-08 |

## 1. Inputs

- **Planes:** static-src + gh-api
- **Tools:** `CHANGELOG*` presence + parse (Keep-a-Changelog conventions); `GET /repos/{o}/{r}/releases` notes quality (non-empty bodies, breaking-change mentions); semantic-release/release-please configs; migration-guide links in breaking releases
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 2. Detection recipe

1. Changelog file inventory + recency vs release tags.
2. Release-notes coverage: % of recent tags with substantive notes.
3. Breaking-change communication: do breaking majors carry migration guidance?
4. Consumer-channel audit (emails/status pages) is org plane → emission text.

Preconditions: tree enumerated.

## 3. Fact schema

```json
{"docs08": {
  "changelog_present": true, "changelog_current": false,
  "releases_sampled": 12, "with_notes_pct": 0.42,
  "breaking_with_migration_guide": {"total_breaking": 3, "documented": 1},
  "release_tooling": null}}
```

## 4. Statusing rules

```yaml
measured_when:  tree enumerated                # changelog/release facts decidable
estimated_when: API unavailable -> file facts only   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium with full API data
scope_limited:  private consumers unreachable -> noted
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DOCS-08.

- `3`: maintained changelog ∧ substantive notes on releases ∧ breaking documented
- `2`: changelog present but lagging or thin notes
- `1`: sporadic notes; breaking changes undocumented
- `0`: no changelog ∧ empty release notes across history

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`

## 8. Evidence string

```
evidence: "release-comms: changelog={bool}(current={bool}); notes {p}% of {n}; breaking-documented {k}/{t}"
```

## 9. Scope/overlaps echo

Release communication surface; version discipline mechanics are API-02.
