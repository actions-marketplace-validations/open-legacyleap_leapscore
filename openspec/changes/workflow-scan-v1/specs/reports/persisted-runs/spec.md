## ADDED Requirements

### Requirement: CLI envelope producer
The envelope contract `{ meta, report, trace }` SHALL gain a second producer beyond the website scan route: the workflow-scan CLI writing to its `--out` path in the runner working directory. The CLI envelope SHALL carry the same `report` shape (`report_schema: "1"`, headline, categories, coverage, gates, `full_table`) and the same `meta` header fields as the website envelope; `meta.engineSha7` SHALL resolve from `LEAPSCORE_SHA`, then the workflow's pinned engine ref input when present, then `git rev-parse --short HEAD`, else the literal `unknown`. Website file layout (`apps/site/reports/<runId>.json`) and fresh-vs-cached routing are unchanged — the CLI file is a portable artifact, not a website cache entry.

#### Scenario: CLI envelope matches website keys
- **WHEN** the same repo seals via the website route and via the CLI
- **THEN** both envelopes parse as `{ meta, report, trace }` with identical required `meta` keys and `report.report_schema === "1"`

#### Scenario: Runner without git still issues identity
- **WHEN** the CLI runs on a runner with no checkout and no SHA env set
- **THEN** `meta.engineSha7` is `"unknown"` and the file is still written and valid
