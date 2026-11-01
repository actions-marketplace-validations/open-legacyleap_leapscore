## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The HTML is ~92% runtime.** Per file: 451 KB minified viewer script, 296 KB inline CSS, 20 KB third-party notices, 21 KB i18n, ~70 KB actual diagram. The runtime is identical across all nine (same `archify 3.2.0`).
- **Rendering is deterministic.** `archify render <type> <spec> <out> --quality showcase --repo-root .` reproduced all nine committed HTML files byte-identically (nine of nine `sha256` matches, verified before this change was written). The output embeds no timestamp and no output path; rewriting `meta.output` also leaves the bytes unchanged.
- **Only the receipts are machine-local.** 36 receipt JSON files (591 KB) carry absolute paths (`/Users/…`), `update.checkedAt` timestamps, and installed-version probes. No HTML or spec contains an absolute path.
- **Measured repository cost.** HTML + spec = 2.30 MiB of git objects (worktree 7.87 MB); spec only = 36 KiB. Git delta-compresses the near-identical runtimes.
- **Evidence is pinned to `4877997`** — one commit behind the roadmap commit that followed it. The HTML embeds that revision in `archify-source-evidence-data` with per-node file/line links.
- **Precedent exists in-tree.** `docs/sample-report/` already commits a generated artifact (196 KB PNG) into `docs/` with a README that states its authority and a `refresh.sh` that regenerates it.

## Goals / Non-Goals

**Goals:**

- A contributor can open any diagram with no install, and can edit any diagram from a reviewable text diff.
- The published set is exactly the reviewed set: no receipt, no timestamped directory, no unreviewed tool output.
- Every diagram states which revision it describes, so drift is visible rather than silent.
- Regeneration is one documented command, and a contributor without `archify` is never blocked from *reading* the repository.

**Non-Goals:**

- A drift detector. The guard verifies bookkeeping, not agreement between a diagram and the current tree — that would fail on every unrelated commit and teach contributors to ignore it.
- Serving the diagrams, or any public URL for them.
- Making `archify` a repository or CI dependency.

## Decisions

### D1 — Commit both the specification and the compiled viewer

Committed: `<type>-<slug>.json` (canonical, authored, diffable) **and** `<type>-<slug>.html` (compiled, committed).

| Alternative | Why rejected |
|---|---|
| HTML only | Uneditable. The next diagram change means re-authoring from scratch; the node→file/line evidence in the HTML is not a source format. |
| Spec only (36 KiB) | Every reader needs the `archify` CLI before they can see anything, which defeats the purpose of explaining the architecture to a contributor. |
| Spec + HTML + receipts | Receipts are byte-bound and machine-local (D4). |

The split mirrors the repository's existing canonical/derived doctrine: the `.json` is what a human edits and reviews, the `.html` is what a human opens. The difference from `docs/rubric/sheets/` is that here the derived artifact is *committed* — justified because it must be usable without a build step, the same argument that keeps `action/dist` committed.

### D2 — `docs/diagrams/`, and the tool's working directory is ignored

`docs/diagrams/` is the published home; `.archify/` joins `.gitignore`.

| Alternative | Why rejected |
|---|---|
| Commit inside `.archify/` with negation rules (the `action/dist` pattern) | The pattern works for `dist/` because the build target *is* the published path. A dot-directory as the discoverable home for documentation is invisible in review and in the docs index, and it leaves 36 receipt files as permanently ignored noise beside the committed ones. |
| `apps/site/public/diagrams/` | Public serving is out of scope, adds 7.8 MB to every deploy, and puts a documentation artifact inside a workspace whose boundary checks exist to keep documentation out of the served graph. |

Policy statement: *archify's working directory is ignored; published artifacts are curated into `docs/diagrams/`.* That makes the commit step an explicit act of review, which is the only thing standing between the repository and a future accidental receipt commit.

### D3 — Flat directory, matched stems, `<type>-<slug>`, no timestamps

```
docs/diagrams/
  README.md
  refresh.sh
  architecture-system-overview.html    architecture-system-overview.json
  ...
```

| Alternative | Why rejected |
|---|---|
| Per-diagram folder (`<slug>/diagram.html` + `<slug>/spec.json`) | Two files per directory across nine directories, for a pair that is only ever useful together in one view. Deeper paths in every link. |
| `sources/` + `rendered/` | Echoes canonical-vs-derived, but separates a pair that is read side by side, and makes the stem-pairing invariant a cross-directory check. |
| Keep the tool's timestamped directory name | A generation timestamp in a committed path is noise that a reviewer cannot act on; the revision pin already dates the content, and it does so meaningfully. |

`<type>` is kept in the filename so a link is self-describing (`sequence-scan-request` vs `scan-request`) and so the archify type needed to regenerate it is recoverable from the path. Matched stems make the pairing invariant a two-line check.

### D4 — Exclude the receipts

All four receipt kinds are dropped. Their durable content is one index line: *all nine passed `finalize` + `browser-check` on archify 3.2.0*.

Reasoning: receipts carry absolute local paths and timestamps; they are bound to exact artifact bytes, so they are invalidated by the first regeneration anyway; and the artifact already self-describes (embedded source evidence + `<meta name="generator" content="archify 3.2.0">`). Committing them would put a personal filesystem path in the repository in exchange for provenance that expires on the next render.

### D5 — The guard is structural; re-rendering stays manual

`tooling/checks/diagrams.ts` (wired as `npm run check:diagrams`, same shape as the sibling checks) enforces only what is readable without the tool:

1. matched `.html`/`.json` stems, both directions;
2. no timestamp or non-kebab segment in a path;
3. no receipt-shaped filename;
4. index links every pair and states the illustrative framing, the pinned revision, and the regeneration command;
5. index revision == spec `meta.repository.revision` == HTML source-evidence revision;
6. `.archify/` is ignored;
7. no site route or published asset references `docs/diagrams/`.

| Alternative | Why rejected |
|---|---|
| Byte-compare `archify render` output in CI | Determinism makes it correct (D1's evidence), but it puts a local skill package on every contributor's `npm test` and on CI, for an artifact nobody's build depends on. Reconsider only if hand-edited HTML is ever observed. |
| No guard at all | The failure modes that actually threaten this set — stray receipts, a stale revision row, an unpaired file after a rename — are exactly the cheap ones, and they are the ones a reviewer skims past. |
| Guard that re-verifies evidence at HEAD | Fails on every unrelated commit. Drift is a documentation-honesty question (the rubric's DOCS-02), answered by dating, not by a red check. |

### D6 — The pin stays at `4877997`; the snapshot is labelled, not re-dated

Bumping `meta.repository.revision` to the landing commit would change the HTML's embedded evidence links while the node→file/line evidence was still verified against the older tree — a fabricated citation, and precisely the drift the pin exists to expose. So the index states `rendered against 4877997`, and `refresh.sh` is the documented path forward: re-verify the evidence, then re-pin.

Consequence to state in the index: these diagrams describe the tree at `4877997`, which predates the roadmap commit. A contributor reading them should treat the file/line links as historical, not as pointers into today's checkout.

## Risks / Trade-offs

- **2.30 MiB of packed objects, ~92% of it duplicated runtime** → Accepted: it buys zero-install viewing, which is the whole point. If the set grows, the cheapest lever is pruning to a hero subset (each pair is independent, so pruning is one `rm` and one index row).
- **A future archify version bump rewrites all nine HTML files** → Regenerate the whole set in one dedicated commit so the diff reads as "tool upgrade", and record the version in the index. Partial regeneration would leave mixed runtimes with no marker.
- **The HTML diff is unreviewable** (one minified blob) → Review the `.json` diff and treat the `.html` as a build output. This is the same review posture as `action/dist`; the structural guard covers the mistakes review cannot see.
- **Diagrams drift from the code and no check catches it** → The revision pin plus an explicit "regenerate when these paths move" line in the index. Silent staleness is the risk; dated staleness is an acceptable documentation state.
- **A contributor cannot regenerate without `archify` 3.2.0** → Documented prerequisite in `refresh.sh` and the index. Reading and reviewing never require it, which is why the specs are committed as readable JSON.
- **`git clean -fd` could still wipe an uncurated working directory** → The published set is committed, so the loss is bounded to whatever was generated since the last curation; that is the intended cost of the ignore rule.
- **The guard could rot into a second source of truth** (a hardcoded list of nine diagrams) → It derives the set from the directory, and only the index rows are authored — same rule as the rubric catalog's derived category table.

## Migration Plan

1. Create `docs/diagrams/`; copy each `candidate.json` to `<type>-<slug>.json` and each `<slug>.html` to `<type>-<slug>.html`.
2. Rewrite `meta.output` in each spec to its new path (verified byte-neutral for the rendered HTML).
3. Re-render each spec and confirm the committed HTML is unchanged before deleting the working directory.
4. Drop the receipts with the working directory; add `.archify/` to `.gitignore`.
5. Write the index and `refresh.sh`; add `docs/README.md` and `AGENTS.md` entries.
6. Land the check and wire `check:diagrams` into the existing `check:*` roster.

Rollback: revert the commit. The working directory is reproducible from the committed specs, and nothing in the build, the scanner, the site, or the Action reads `docs/diagrams/`.

## Open Questions

- **Prune to a hero subset?** The architecture overview, workflow pipeline, and dataflow envelope overlap. Deferrable: pruning is mechanical and does not change the contract.
- **Pin `archify` as a devDependency?** Only becomes relevant if D5's byte-compare guard is ever wanted. Deferrable without affecting the specs.
- **Refresh trigger wording.** Which code moves should force a regeneration is a judgement call best written after the first real drift; the index carries the command and the pin in the meantime.
