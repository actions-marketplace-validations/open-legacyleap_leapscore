# DATA-04 — Legacy Storage Technology

> **Category:** [Data & Schema Evolution](./README.md) · **Shared configuration:** [model/config.md](../../model/config.md) · **Catalog guide:** [README.md](../../README.md)
>
> **Half boundary:** §1–§4 carry rubric semantics (identity, definition, scoring, remediation); §5–§10 carry the detector contract (inputs, detection, facts, statusing, gates, evidence). One canonical file, not two.

## 1. Identity

| field | value |
|---|---|
| ID | DATA-04 |
| Name | Legacy Storage Technology |
| Category | DATA — Data & Schema Evolution |
| Engine tier | B |
| Default status | unknown |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔷 ~1–2 days — storage inventory + support lifecycle check. |
| Thresholds & 0–3 criteria | see §3 and `model/config.md`; thresholds are not duplicated here |

## 2. Definition and impact

- **Definition:** Core data lives in storage technologies that are unmaintained, hard to query, or impossible to evolve — flat files, XML blobs, legacy NoSQL with no maintenance, file-based state, mainframe-adjacent stores, object graphs hand-rolled on top of file systems, or databases long off the vendor's support matrix.
- **Why it signals obsolescence:** Storage is the deepest lock-in a codebase has. When the *format/technology* is EOL, the code's options collapse: every feature is a fight with a dead file layout, and migrations out are expensive and risky. This is the data-layer version of ECOS-01.
- **Where it manifests:** XML/flat-file/CSV stores for core records, proprietary binary formats, a database version supported no longer (e.g., ancient MySQL), file-system blobs with indexes in code, abandoned document stores, "the data is in the files on `//oldfs`", archived formats no tool reads.
- **Objective metric:** `# of systems-of-record on EOL/unsupported technology`; `% of critical data in non-queryable/unmaintainable stores`; `# of legacy-format file stores`; `vendor support status per store`.
- **Yellow flag (warning):** Some non-core data in legacy formats/stores; a supported-but-old DB version; filesystem blobs with an index layer. *(Rationale: warning — friction but not crisis.)*
- **Red flag (critical):** Core data (money, identity, compliance) in an unsupported/unmaintainable store, or a proprietary format whose tooling has vanished. *(Rationale: the data can't be queried, migrated, or secured — a locked vault with no key.)*
- **Example symptom:** "Customer history lives in 4 TB of XML files written by a Java 1.4 app 'decommissioned' in 2016. Search is a full-disk `grep`. The compliance team needs to produce a customer record for a court order. It takes three days."
- **Blast radius:** Query/analytics capability, compliance ability (produce records), feature velocity on legacy data, migration cost ceiling, egress/security.

## 3. Scoring semantics

- **Scoring criteria (0–3, per global core-path taxonomy):** 3 = all stores supported; 2 = legacy in non-core; 1 = legacy reads in core; 0 = core of record unmaintainable.

Threshold values and category weighting remain owned by `model/config.md`; the criteria above are the indicator-specific mapping and are not reinterpreted by the implementation sections below.

## 4. Remediation

- **Remediation playbook:** Quick win: stand up a read side (index the files into a modern store, keep legacy as archive), build the extraction utilities. Structural fix: a data-migration program — move systems of record to maintained technology one store at a time (strangler pattern for data), keep legacy read-only during migration, archive what's truly dead.
- **Gold standard / target state:** All systems-of-record on maintained technology; legacy formats readable/exportable or archived with access paths; critical data queryable with modern tooling.

The verify-effort tag is defined once in §1 and applies to this remediation path.

## 5. Applicability and inputs

> **Archetype applicability (new):** `na_when` also fires on archetype+plane: DATA rows N/A if `!has_data && archetype in {library, docs, agent-skills, infra}`; PERF rows N/A if `!has_deploy`; API rows N/A if `!has_server`; irrelevant tiers (e.g. docs→API) fire without plane check. Required rows (SEC-01/02, ECOS-05/01) never N/A. Exhaustive plane inventory required.

- **Planes:** static-src + ecosystem (endoflife.date DB slugs)
- **Tools:** storage-system enumeration: docker-compose services, Helm/K8s manifests, Terraform resources (`aws_db_instance`, `azurerm_*`, `google_storage_bucket`), connection-string schemes (`postgres://`, `mssql://`, `db2`, `xml`/`mdb` file greps), driver deps in manifests
- **Rate-cost:** api-budgeted (lifecycle lookups per distinct system)
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 6. Detection recipe

- **Detection method:** Storage inventory — enumerate the systems of record (DBs, file stores, queues, archives), check vendor support/lifecycle for each (endoflife for DB versions), inspect the formats of the files (headers, extensions, queryability), measure share of critical data in unqueryable/unmaintained stores.

1. Enumerate storage systems of record with type classification: RDBMS / NoSQL / object-store / flat-file / queue-as-storage.
2. Version extraction where pinned (compose image tags, tf instance_class/engine_version).
3. Lifecycle lookup per system+version (endoflife.date slug table).
4. Flat-file store detection: structured-data files in repo referenced as persistence paths (`.mdb`, `.dbf`, XML data dirs).

Preconditions: ≥1 storage reference found.

## 7. Fact schema

```json
{"data04": {
  "systems": [{"kind": "rdbms", "name": "postgresql", "version": "9.6", "eol_past": true, "source": "docker-compose:14"},
               {"kind": "flat-file", "name": "access-mdb", "evidence": "data/registry.mdb"}],
  "unversioned": 2}}
```

## 8. Status and score mapping

### Statusing rules

```yaml
measured_when:  never auto-measured            # inventory completeness beyond repo unknowable
estimated_when: >=1 storage reference enumerated   # clamp [1,2]; confidence medium if versioned+lifecycle-resolved
unknown_when:   zero storage references in a tree that otherwise has persistence signals
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all systems version-pinned; low otherwise
scope_limited:  managed-cloud-only shops (no infra in repo) -> estimated + scope-limited
```

### Score mapping predicates

Criteria/Y-values: see §3. Estimated ⇒ score ∈ {1,2}:

- `2`: modern systems present ∨ legacy only for niche/archival data
- `1`: EOL-or-legacy system carrying non-core data ∨ unversioned legacy present
- `3`/`0` unreachable by construction

## 9. Gate, failure, and budget behavior

### Gate hooks

none.

### Failure and budget semantics

- Budget class: `api-budgeted`
- Lifecycle-table miss → system listed unmapped; row stays estimated on remaining evidence

## 10. Evidence and output

### Evidence string

```
basis: "storage-inventory {n} systems: {list}; eol-past={bool} ({source}) [repo-visible set only]"
```

### Report-facing emission text

A report row emits the indicator name, lifecycle status, score/verdict when gradeable, and exactly one evidence or basis string. Measured and estimated rows may carry the remediation in §4; unknown rows disclose the measure path instead.

### Scope/overlaps

Storage technology choices/lifecycle; runtime contention is DATA-05, backup posture DATA-06.
