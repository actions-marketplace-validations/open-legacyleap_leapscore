## Why

Nine validated archify diagrams of the current architecture exist only as an untracked tool working directory (`.archify/`, 8.2 MB, 9 × `<type>-<slug>-<timestamp>/`). They are the only explanation of how the producer contract, the stateless scanner, the static site, the CLI/Action, and the separate surface app relate — and they are one `git clean -fd` from gone. Nothing in the repository references them, so the knowledge is invisible to contributors and cannot be reviewed.

The artifacts are also cheaper to carry than their byte count suggests. Each HTML is ~92% archify 3.2.0 runtime (451 KB minified script + 296 KB CSS + 20 KB notices + 21 KB i18n) around ~70 KB of actual diagram, so git delta-compression packs the whole set — HTML plus spec — into **2.30 MiB** of objects (measured on a throwaway clone), against 36 KiB for the specs alone. Re-rendering every spec with `archify render … --quality showcase --repo-root .` reproduces all nine HTML files **byte-identically** (nine of nine hash matches), and rewriting `meta.output` leaves the bytes unchanged — so the compiled artifact is a pure, reproducible function of its spec, and relocation costs nothing.

This change publishes them as **contributor-only documentation**: committed, indexed, refreshable, and explicitly dated. They are not served by the site and not a requirements source — a snapshot of the tree at a pinned revision, which is exactly the honesty the rubric's own DOCS-02 indicator demands of architecture diagrams.

## What Changes

- **New docs area `docs/diagrams/`** — nine diagrams, each a matched pair (`<type>-<slug>.html` compiled viewer + `<type>-<slug>.json` spec), plus an index `README.md` that states the area's authority (`illustrative; a snapshot, not a requirements source`), the pinned revision per diagram, and the refresh command. The tool's timestamped directory names are dropped; `<type>-<slug>` is kept so a filename stays self-describing and sortable.
- **The spec is the canonical input, the HTML is the committed view** — the JSON carries nodes, edges, cards, and `meta.repository.revision`; the HTML is the zero-dependency viewer a contributor opens without installing anything. Both are committed because neither alone is usable: the HTML alone cannot be edited, and the spec alone needs the archify CLI to read.
- **Receipts are excluded** — `*.delivery.json`, `*.finalize.json`, `*.finalize-summary.json`, `*.browser-check.json` (591 KB across nine) are the only files carrying absolute local paths (`/Users/…`) and `update.checkedAt` timestamps, and they are bound to exact artifact bytes, so any regeneration invalidates them. Their one durable fact — all nine passed `finalize` + `browser-check` on archify 3.2.0 — is recorded as a line in the index instead.
- **The working directory is ignored, the curated output is committed** — `.archify/` joins `.gitignore`, so a future archify run cannot silently commit receipts, and the published set stays the reviewed set.
- **A dependency-free structural guard** — a `check:diagrams` check enforces: matched `.html`/`.json` stems, no timestamped path segments, no receipt-shaped files, the README's pinned revision agreeing with each spec's `meta.repository.revision`, and `.archify/` remaining ignored. It does **not** re-render (that would make archify a repository dependency for a contributor-only artifact); hand-edited HTML is caught in review, and `refresh.sh` is the documented path to regenerate.
- **The pinned revision stays at `4877997`** — the revision the evidence was verified against, one commit behind the roadmap commit that followed it. Re-pinning the field without re-authoring the node→file/line evidence would fabricate a citation, so the snapshot is labelled rather than re-dated.
- **`refresh.sh`** — the `docs/sample-report/refresh.sh` pattern: re-render every spec against the pinned revision, review the diff, commit. Requires `archify` 3.2.0 on `PATH`; not a repository dependency.
- **Documentation entry points updated** — `docs/README.md` gains the area with an `Illustrative only` authority line, and `AGENTS.md`'s "Two live doc trees" heading stops contradicting a tree that now has a third (non-authoritative) area.

Non-goals (explicitly out of scope):

- **Public serving.** The site never gains the diagrams: no `apps/site/public/diagrams/`, no route, no link from `/method`. They are contributor material; adding 7.8 MB to every deploy is not a trade this change makes.
- **A byte-compare freshness gate.** Determinism makes `archify render` + `sha256` a viable CI check, but it would put a local skill package on the critical path of every contributor's `npm test`. Deferred until drift actually bites; the light guard covers the failure modes that have occurred (misnamed stems, stray receipts, stale revision rows).
- **Re-authoring evidence at a newer revision.** Moving the pin forward means re-verifying every node's file/line reference at that revision — a fresh diagram authoring round, not a find-and-replace.
- **Committing the receipts, the timestamped directories, or the `candidate.json` originals in place.**
- No change to the rubric, the scanner, the site, the Action, or any scored behavior.

## Capabilities

### New Capabilities

None. The area is a new contract on the documentation tree, which `documentation-structure` already owns.

### Modified Capabilities

- `documentation-structure`: adds one requirement — architecture diagrams live at `docs/diagrams/` as matched `<type>-<slug>.html`/`.json` pairs, are contributor-only and illustrative (never a requirements source, never site-served), carry a revision pin that the index restates, exclude delivery receipts, and keep the tool's working directory ignored. The existing requirements are unchanged: the rubric's generated-artifact rule stays scoped to `docs/rubric/sheets/`, and the link-resolution rule covers the new index because it is Markdown.

## Impact

- **New**: `docs/diagrams/README.md`, `docs/diagrams/refresh.sh`, 18 artifact files (9 `.html` + 9 `.json`, ~7.87 MB worktree / 2.30 MiB packed).
- **Moved**: nine `candidate.json` → `docs/diagrams/<type>-<slug>.json` with `meta.output` rewritten to the new path (proven byte-neutral: rewriting `meta.output` does not change the rendered HTML); nine `<slug>.html` → `docs/diagrams/<type>-<slug>.html`.
- **Dropped**: 36 receipt JSON files under `.archify/` (never committed).
- **Edited**: `.gitignore` (`.archify/`), `docs/README.md` (area + authority line), `AGENTS.md` ("Two live doc trees" heading and its bullet list), `package.json` (a `check:diagrams` script alongside the existing `check:*` roster), `tooling/checks/diagrams.ts` (new, same shape as the sibling checks).
- **Docs contracts**: `openspec/specs/documentation-structure/spec.md` gains the diagram-area requirement; `npm run check:documentation-structure` remains the tree's gate and is joined by `check:diagrams`.
- **Dependencies**: none added. `archify` stays a contributor tool, documented in `refresh.sh` and the index; no npm dependency, no CI requirement, no network.
- **Out of scope for scoring**: diagrams are documentation of the repository, not inputs to a scan; nothing under `docs/diagrams/` is read by the engine, the site, or the Action.
