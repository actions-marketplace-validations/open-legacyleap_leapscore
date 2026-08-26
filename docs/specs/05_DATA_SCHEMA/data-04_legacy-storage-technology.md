# DATA-04 — Legacy Storage Technology — Implementation Spec

## 0. Identity

| field | value |
|---|---|
| Tier / default status | B · **estimated** (storage inventory from configs; encyc B·unknown, matrix C·unknown) |
| v1 flag | PART (candidate) |
| Gates fed | none |
| Rollup / deep-dive | standard · folds into DATA category % |
| Verify effort | 🔷 human · engine: inventory + lifecycle lookup |
| Thresholds & 0–3 criteria | see encyclopedia §DATA-04 |

## 1. Inputs

- **Planes:** static-src + ecosystem (endoflife.date DB slugs)
- **Tools:** storage-system enumeration: docker-compose services, Helm/K8s manifests, Terraform resources (`aws_db_instance`, `azurerm_*`, `google_storage_bucket`), connection-string schemes (`postgres://`, `mssql://`, `db2`, `xml`/`mdb` file greps), driver deps in manifests
- **Rate-cost:** api-budgeted (lifecycle lookups per distinct system)
- **Ecosystems:** agnostic
- **Applicability:** DATA-01 clause-b. Else applicable.

## 2. Detection recipe

1. Enumerate storage systems of record with type classification: RDBMS / NoSQL / object-store / flat-file / queue-as-storage.
2. Version extraction where pinned (compose image tags, tf instance_class/engine_version).
3. Lifecycle lookup per system+version (endoflife.date slug table).
4. Flat-file store detection: structured-data files in repo referenced as persistence paths (`.mdb`, `.dbf`, XML data dirs).

Preconditions: ≥1 storage reference found.

## 3. Fact schema

```json
{"data04": {
  "systems": [{"kind": "rdbms", "name": "postgresql", "version": "9.6", "eol_past": true, "source": "docker-compose:14"},
               {"kind": "flat-file", "name": "access-mdb", "evidence": "data/registry.mdb"}],
  "unversioned": 2}}
```

## 4. Statusing rules

```yaml
measured_when:  never auto-measured            # inventory completeness beyond repo unknowable
estimated_when: >=1 storage reference enumerated   # clamp [1,2]; confidence medium if versioned+lifecycle-resolved
unknown_when:   zero storage references in a tree that otherwise has persistence signals
na_when:        applicability fired
clamp:          [1,2]
confidence:     medium when all systems version-pinned; low otherwise
scope_limited:  managed-cloud-only shops (no infra in repo) -> estimated + scope-limited
```

## 5. Score mapping (predicates)

Criteria/Y-values: see encyclopedia §DATA-04. Estimated ⇒ score ∈ {1,2}:

- `2`: modern systems present ∨ legacy only for niche/archival data
- `1`: EOL-or-legacy system carrying non-core data ∨ unversioned legacy present
- `3`/`0` unreachable by construction

## 6. Gate hooks

none.

## 7. Failure & budget semantics

- Budget class: `api-budgeted`
- Lifecycle-table miss → system listed unmapped; row stays estimated on remaining evidence

## 8. Evidence string

```
basis: "storage-inventory {n} systems: {list}; eol-past={bool} ({source}) [repo-visible set only]"
```

## 9. Scope/overlaps echo

Storage technology choices/lifecycle; runtime contention is DATA-05, backup posture DATA-06.
