# DOCS-08 — No Release Communication / Changelog

> **Canonical unified indicator contract.** This file combines the rubric semantics and implementation contract for DOCS-08. Edit this file; the legacy path [docs-08_no-release-communication-changelog.md](../../../specs/09_DOCS_KNOWLEDGE/docs-08_no-release-communication-changelog.md) is a compatibility alias.
> **Category:** [Documentation & Knowledge Continuity](../../09_DOCS_KNOWLEDGE.md) · **Shared configuration:** [11_WEIGHTS_THRESHOLDS_CONFIG.md](../../11_WEIGHTS_THRESHOLDS_CONFIG.md) · **Catalog guide:** [README.md](../../README.md)
> **Canonical path:** `docs/rubric/indicators/09_DOCS_KNOWLEDGE/DOCS-08_no-release-communication-changelog.md`

## 1. Identity

| field | value |
|---|---|
| ID | DOCS-08 |
| Name | No Release Communication / Changelog |
| Category | DOCS — Documentation & Knowledge Continuity |
| Engine tier | B |
| Default status | measured |
| v1 flag | YES |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DOCS category % |
| Verify effort | 🔶 ~2–4 h — release-history + consumer-survey audit. |
| Thresholds & 0–3 criteria | see §3 and `11_WEIGHTS_THRESHOLDS_CONFIG.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** There's no changelog, no release notes, no migration guides, no announcement channel for API/behavior changes — consumers and users discover breaking changes by finding them the hard way.
- **Why it signals obsolescence:** Release communication is the social layer of an API: even perfect versioning (API-02) is useless if nobody learns about it. In a legacy system, this absence is typical of "release day = nobody's informed" — and it's the mechanism by which every breaking change becomes a support incident. (Companion to API-08's consumer blindness.)
- **Where it manifests:** No CHANGELOG.md, no release notes, repos without semantic-release, breaking changes announced "via the grapevine," migration guides written after the damage, rebrands/deprecations silent.
- **Objective metric:** `changelog exists + current? (per repo)`; `% of breaking changes with a published migration note`; `" heard about it from the incident" rate`; `release notes tooling present?`.
- **Yellow flag (warning):** Changelog exists but irregular/manual, migration notes sometimes written, announcements ad hoc. *(Rationale: warning — the channel exists, the discipline is thin.)*
- **Red flag (critical):** No changelog or release notes at all, breaking changes ship unannounced, consumers/users learn from failures. *(Rationale: the product's change contract with its ecosystem is void — every change is a surprise tax.)*
- **Example symptom:** "The mobile app update silently broke a field the frontend depended on. The changelog 'didn't exist this quarter.' User reviews: 'what happened to my reports?' — the breaking change was discovered by customers, collectively, on release day."
- **Blast radius:** Consumer trust, incident volume, ecosystem velocity, support load, versioning value (API-02) — you can't get the benefit without the communication.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = automated notes + guides; 2 = changelog manual/irregular; 1 = notes absent, changes announced late; 0 = no communication, change-by-surprise.

Threshold values and category weighting remain owned by `11_WEIGHTS_THRESHOLDS_CONFIG.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: adopt a CHANGELOG process (Keep-a-Changelog, auto-generated from commits/PRs), publish release notes for the top consumers, write migration guides for open breaking changes (backfill). Structural fix: semantic-release automation (version + changelog + notes automated), a release-communication channel (port status page + email), "breaking = migration guide in same MR" rule.
- **Gold standard / target state:** Every release has automated notes; every breaking change has a migration guide published with the change; consumers hear first, break never (silently).

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

- **Planes:** static-src + gh-api
- **Tools:** `CHANGELOG*` presence + parse (Keep-a-Changelog conventions); `GET /repos/{o}/{r}/releases` notes quality (non-empty bodies, breaking-change mentions); semantic-release/release-please configs; migration-guide links in breaking releases
- **Rate-cost:** api-budgeted
- **Ecosystems:** agnostic
- **Applicability:** never N/A for scored repos.

## 6. Detection recipe

- **Detection method:** Release-communication audit — changelog exists + auto-generated? Release notes published to consumers/users (email/blog/portal)? Breaking changes get migration guides (docs link in the breaking commit)? Interview consumers: "how did you hear about the last breaking change?" — if the answer is "we broke," it's absent.

1. Changelog file inventory + recency vs release tags.
2. Release-notes coverage: % of recent tags with substantive notes.
3. Breaking-change communication: do breaking majors carry migration guidance?
4. Consumer-channel audit (emails/status pages) is org plane → emission text.

Preconditions: tree enumerated.

## 7. Fact schema

```json
{"docs08": {
  "changelog_present": true, "changelog_current": false,
  "releases_sampled": 12, "with_notes_pct": 0.42,
  "breaking_with_migration_guide": {"total_breaking": 3, "documented": 1},
  "release_tooling": null}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  tree enumerated                # changelog/release facts decidable
estimated_when: API unavailable -> file facts only   # clamp [1,2], confidence low
unknown_when:   tree not enumerable
na_when:        never
clamp:          [1,2]                             # n/a — measured row
confidence:     medium with full API data
scope_limited:  private consumers unreachable -> noted
```

### Score mapping predicates

Criteria/Y-values: see §3.

- `3`: maintained changelog ∧ substantive notes on releases ∧ breaking documented
- `2`: changelog present but lagging or thin notes
- `1`: sporadic notes; breaking changes undocumented
- `0`: no changelog ∧ empty release notes across history

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`

## 10. Evidence and output

### Evidence string

```
evidence: "release-comms: changelog={bool}(current={bool}); notes {p}% of {n}; breaking-documented {k}/{t}"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Release communication surface; version discipline mechanics are API-02.
