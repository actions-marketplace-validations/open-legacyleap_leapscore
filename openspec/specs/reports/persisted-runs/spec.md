## Purpose

Persisted scan runs as addressable JSON files keyed by a repo-derived run identity, with a manifest-style envelope and deterministic fresh-vs-cached routing so any past report can be revisited without re-running the engine.

## Requirements

### Requirement: runId grammar and repoSlug derivation

`runId` SHALL remain `<repoSlug>__<engineSha7>__<ts>` as the in-frame run identity carried by the terminal `report` frame's `meta`, with the same derivation rules (normalized `owner/repo` lowercased to `owner__repo`, 7-char engine SHA or literal `unknown`, file-safe timestamp). `runId` SHALL validate as a single path segment with no `/` or `..`. It SHALL NOT imply retrievability: no store backs it.

#### Scenario: Repo URL maps to deterministic repoSlug

- **WHEN** inputs are `https://github.com/Vercel/next.js.git`, `github.com/vercel/next.js/tree/canary`, and `vercel/next.js`
- **THEN** all three derive the same `repoSlug` `vercel__next.js` and produce distinct `runId`s only via `engineSha7` and `ts`

#### Scenario: Engine SHA is part of identity

- **WHEN** two scans for the same repo run against engine commits `abc1234` and `def5678`
- **THEN** their terminal frames carry distinct `runId`s differing in `engineSha7`

#### Scenario: Timestamp distinguishes same-second reruns

- **WHEN** two fresh runs for the same repo and same engineSha start within the same second
- **THEN** their `ts` differ at ms granularity and produce two distinct `runId`s

### Requirement: Meta header fields

Each terminal `report` frame's `meta` SHALL contain at minimum: `repo` (`owner/repo`), `repoUrl` (`https://github.com/owner/repo`), `repoSlug`, `engineSha7`, `runId`, `ranAt` (ISO-8601), `durationMs` (wall-clock ms from scan start to `done`), `budgetMs` (from the scan's budget), `repoSha` (the scanned repo's HEAD commit, or `"unknown"` for GH-only scans), `score`, `tier`, `status` (`complete`), `engine_version`, `rubric_version`, and `filename`. Any site-owned history view SHALL render list rows solely from `meta` without opening `report`.

#### Scenario: GH-only scan records unknown repoSha

- **WHEN** a scan completes without cloning (all requested indicators were GH-API)
- **THEN** `meta.repoSha` is `"unknown"` while still displaying score and tier

#### Scenario: Meta mirrors report headline

- **WHEN** `report.headline.score` is 62.4 with tier `Moderate`
- **THEN** `meta.score` is 62.4 and `meta.tier` is `Moderate`, consistent with the frame's `report`

### Requirement: Engine snapshot carries repoSha

The unified scan's terminal snapshot (yielded on `done`) SHALL include the scanned repo's HEAD commit as `scanned_commit` (full SHA from `shallowClone` when cloning, otherwise `"unknown"`). The scan route SHALL propagate this into both `meta.repoSha` and `report.snapshot.scanned_commit` so history display is decoupled from the repo's mutable HEAD.

#### Scenario: Clone-backed scan records repoSha

- **WHEN** the unified scan clones `vercel/next.js` at commit `1a2b3c4d...`
- **THEN** the terminal snapshot carries `scanned_commit: "1a2b3c4d..."`, and the frame's `meta.repoSha` equals that SHA

### Requirement: CLI envelope producer

The envelope contract `{ meta, report, trace }` SHALL have multiple producers on the producing side: the scanner service's terminal frame, and the workflow-scan CLI writing to its `--out` path in the runner working directory. The CLI envelope SHALL carry the same contract-shaped `report` and the same `meta` header fields as the scanner service's terminal frame; `meta.engineSha7` SHALL resolve from `LEAPSCORE_SHA`, then the workflow's pinned engine ref input when present, then `git rev-parse --short HEAD`, else the literal `unknown`. Neither producer writes into any website directory: the CLI file is a portable artifact and the scanner holds no store.

#### Scenario: CLI envelope matches website keys

- **WHEN** the same repo seals via the scanner service's terminal frame and via the CLI file
- **THEN** both artefacts parse as `{ meta, report, trace }` with identical required `meta` keys and the same report contract version (the "website keys" are the contract keys; no website directory is involved)

#### Scenario: Runner without git still issues identity

- **WHEN** the CLI runs on a runner with no checkout and no SHA env set
- **THEN** `meta.engineSha7` is `"unknown"` and the file is still written and valid

#### Scenario: No producer writes website build inputs directly

- **WHEN** the scanner seals a run and the CLI writes an artifact
- **THEN** neither has written into any website directory — the scanner holds no store and the website has no build-input directory; the CLI file is a portable artifact and the scanner frame is a stream artefact

### Requirement: A fresh scan is executed, never replayed

A fresh scan SHALL always be executed by the scanner service via its scan API and SHALL never be served from a previously sealed artefact. The website SHALL never execute a scan and SHALL never request one: no website route SHALL import scanner implementation code, no website route SHALL accept a scan request, and the built site SHALL contain no client that contacts a scanner. A sealed artefact SHALL be rendered only as itself — an immutable, labelled sample — and never as a fresh run.

#### Scenario: Repeat scan produces a distinct run

- **WHEN** the same repository is scanned twice
- **THEN** each scan executes and produces a distinct `runId`, and no previously sealed artefact is reused as the result

#### Scenario: Website exposes no scan endpoint

- **WHEN** the website's route list is inspected
- **THEN** no route accepts a scan request, and the boundary check from the `scanner-service` capability enforces this

#### Scenario: Built site carries no scanner client

- **WHEN** the built site artifact is inspected
- **THEN** it contains no scanner origin, no scan request builder, and no build input that would enable one

#### Scenario: Sealed artefact is never presented as fresh

- **WHEN** a sealed envelope is rendered on the site
- **THEN** it is labelled as a committed sample and its sealed values are displayed unchanged
