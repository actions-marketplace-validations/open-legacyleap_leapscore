# Architecture diagrams

Nine archify diagrams of the LeapScore system. Each diagram is a matched pair: a self-contained `.html` viewer you can open with no install, and the `.json` specification it was rendered from.

**Authority: illustrative snapshots, not a requirements source.** These describe one revision of the tree. They are contributor material — not served by the site, not linked from product pages, and never the tiebreaker when a document, a spec, or the code says otherwise. `openspec/specs/` is the current truth for scan and report behavior; `docs/rubric/` is the rubric.

**Provenance:** all nine passed `finalize` + `browser-check` on archify 3.2.0.

## Index

| Diagram | Answers | Type | Rendered against |
|---|---|---|---|
| [architecture-leapscore-system.html](./architecture-leapscore-system.html) · [spec](./architecture-leapscore-system.json) | How do the producer contract, stateless scanner, static site, CLI/Action, and separate surface app relate? | `architecture` | `4877997` |
| [class-contracts-seams.html](./class-contracts-seams.html) · [spec](./class-contracts-seams.json) | Which types form the report envelope, its rollup parts, the presentation seam, and the detector contract? | `class` | `4877997` |
| [dataflow-scoring-envelope.html](./dataflow-scoring-envelope.html) · [spec](./dataflow-scoring-envelope.json) | How do detector facts become graded rows, a rollup, and one sealed envelope every consumer reads? | `dataflow` | `4877997` |
| [erd-report-envelope.html](./erd-report-envelope.html) · [spec](./erd-report-envelope.json) | What entities make up the persisted report document — identity, rollup, row/gate evidence, baseline delta? | `erd` | `4877997` |
| [lifecycle-indicator-row.html](./lifecycle-indicator-row.html) · [spec](./lifecycle-indicator-row.json) | How does one indicator row move from requested to sealed, and where is a non-measured path disclosed? | `lifecycle` | `4877997` |
| [sequence-scan-request.html](./sequence-scan-request.html) · [spec](./sequence-scan-request.json) | What happens between `GET /scan` admission and the single terminal frame? | `sequence` | `4877997` |
| [tree-repository.html](./tree-repository.html) · [spec](./tree-repository.json) | Where do the producer apps, shared contracts, generated rubric data, and boundary checks live? | `tree` | `4877997` |
| [waterfall-scan-budget.html](./waterfall-scan-budget.html) · [spec](./waterfall-scan-budget.json) | How does a 240s indicator-driven budget split across the remote-scan lanes? (Illustrative shares; timings are not measured.) | `waterfall` | `4877997` |
| [workflow-scan-pipeline.html](./workflow-scan-pipeline.html) · [spec](./workflow-scan-pipeline.json) | How does one indicator-count budget span the GitHub-API lane, the shallow clone, clone detectors, and sealing? | `workflow` | `4877997` |

## Drift

The pin is `4877997` for all nine — the revision the node→file/line evidence was verified against, one commit behind the roadmap commit that followed it. **The pin predates the current HEAD.** Treat the embedded file/line links as a historical citation, not as pointers into today's checkout. A stale diagram is not corrected by editing `meta.repository.revision`: moving the pin forward means re-verifying the evidence at that revision, which is a fresh authoring round.

Regenerate when the layout or behavior a diagram shows changes, not on every commit.

## Refresh

Requirements: `archify` 3.2.0 on `PATH`. It is a contributor tool, not a repository or CI dependency — reading and reviewing the diagrams never requires it.

From the repository root:

```bash
docs/diagrams/refresh.sh
```

The script re-renders every `.json` with `--quality showcase --repo-root .` into a temporary directory and compares each result with the committed `.html`, printing `MATCH` or `DIFF` per file. It never rewrites a committed artifact: review the diff, re-render deliberately, and commit the pair together. Regenerate the whole set in one commit so the identical ~92% runtime across the files stays in step; a partial regeneration leaves mixed archify versions with no marker.

## What is here, and what is not

Committed per diagram: the `.json` spec (authored, reviewable) and the `.html` viewer (compiled, zero-dependency). Nothing else.

Delivery receipts (`*.delivery.json`, `*.finalize.json`, `*.finalize-summary.json`, `*.browser-check.json`) are deliberately excluded: they carry machine-local absolute paths and generation timestamps, and they are byte-bound to a specific render, so the next regeneration invalidates them. Their one durable fact is the provenance line above.

The tool's working directory `.archify/` is ignored by git. A future run stays untracked; publishing is an explicit copy into this directory, so the committed set is the reviewed set. `npm run check:diagrams` enforces the pairing, naming, index, revision, and ignore rules; it does not re-render.
