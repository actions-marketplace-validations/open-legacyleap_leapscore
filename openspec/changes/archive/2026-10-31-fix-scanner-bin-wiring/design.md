## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **npm owns `node_modules/.bin`.** Shims are generated only for packages that declare `bin` in the `package.json` npm actually installs. A workspace package without `bin` never gets a shim; the old shim from a pre-rename package survives as a dangling link because nothing claims the name to replace it.
- **Two install topologies are live.** `.github/workflows/leapscore-scan.yml` runs `npx -p tsx@4 -p "github:<repo>#<ref>" surface`, and `docs/plans/14_WORKFLOW_SCAN_V1.md` documents the same form for `leapscore-scan`. That path reads the **root** `package.json` `bin` block, because a git install of this repo installs only the root package — workspace packages are not linked into the consumer.
- **Checks are root npm scripts, not CI steps.** No workflow in `.github/workflows` runs `check:*`; `check:site-boundary`, `check:detector-isolation`, and `check:rubric-consistency` are invoked from the root `package.json` by convention.
- **`apps/surface` is the working precedent**: `bin` declared in the package, shim resolves, and the root `bin` block also lists it for the npx path.

## Goals / Non-Goals

**Goals:**

- A workspace install produces a resolving `leapscore-scan` shim with no manual step beyond `npm install`.
- Both topologies keep the same command set and the same target per command.
- A single offline check makes any future drift (rename, dropped mapping, hand-edited shim) fail loudly.

**Non-Goals:**

- Renaming or aliasing the command (see proposal non-goals).
- Making the check a CI gate — no workflow runs checks today; this change does not invent one.
- Publishing the packages or changing `private: true` semantics.

## Decisions

**D1 — Declare `bin` in `apps/scanner/package.json`, not root-only.**
The workspace shim is generated from the workspace package's own `bin`. Root-only mapping cannot produce it.
*Alternatives:* (a) a `postinstall` script that hand-creates the symlink — rejected: npm rewrites `.bin` on install, so a hand-rolled link is exactly the artifact that rots; (b) a new meta-package that owns all bins — rejected: adds a package to solve a two-line mapping.

**D2 — Keep the root `bin` block.**
It is load-bearing for `npx -p "github:<repo>#<ref>"`, which the live workflow's surface step and `docs/plans/14` depend on. Removing it to "avoid duplication" would break a working path to fix a broken one.
*Alternatives:* (a) delete root `bin` and require a local clone — rejected: breaks the workflow and the documented one-liner; (b) move `surface`/`leapscore-scan` mapping into a published sub-package — rejected: the git-install form installs the root package, so the mapping has to be there.

**D3 — The check compares declarations and shims, not behavior.**
`tooling/checks/bin-wiring.ts` reads the root `package.json` and every `apps/*`/`packages/*` `package.json`, builds `name → target` maps per topology, then for each workspace-declared command verifies `node_modules/.bin/<name>` exists, resolves (via `realpathSync`) to the declared target, and is executable. It fails when a name maps to different targets across topologies, when two workspace packages claim the same name, or when a documented invocation site exists without a mapping.
*Alternatives:* (a) run `<command> --help` for each bin — rejected: slow, needs tsx, and would conflate wiring with CLI regressions; (b) glob `node_modules/.bin` for dangling links only — rejected: catches the symptom, not the missing declaration.

**D4 — "Still-invoked" is a small explicit table, not a repo-wide grep.**
The check carries a short table of documented invocation sites (`command → [file paths]`). For each, if the file exists and mentions the command, the mapping must exist. Grepping the whole repo for `leapscore-scan` would match this change's own artifacts, archived specs, and prose, producing false failures.
*Alternatives:* repo-wide regex — rejected as above; no invocation check at all — rejected: that is the exact failure mode being fixed (docs kept saying `leapscore-scan` after the mapping moved).

**D5 — Degrade gracefully when `node_modules` is absent.**
If `node_modules/.bin` does not exist, the check validates declarations and cross-topology agreement only, prints that shim verification was skipped, and exits `0`. A fresh clone before `npm install` must not fail a check it cannot evaluate.
*Alternatives:* fail hard — rejected: turns a pre-install state into a false red.

**D6 — Regenerate the lockfile with `npm install`; never hand-edit.**
`package-lock.json` records the workspace `bin` block and the link, so it is a generated artifact of the install. The repair is validated by the shim resolving, not by reading the diff.

**D7 — Docs name the live path and the rule.**
`apps/scanner/README.md` gains a short entry-point section stating both topologies and that the workspace `bin` is the local authority; the stale `packages/engine/bin/scan.ts` references in `docs/plans/14`, `docs/plans/15`, and `docs/notes/open-source-release-*.md` are corrected to `apps/scanner/bin/scan.ts`.

## Risks / Trade-offs

- **[`npm install` churns the lockfile]** → The change is expected to touch `package-lock.json`; review the `apps/scanner` entry and the `.bin` link rather than the whole diff, and do not hand-resolve unrelated version bumps.
- **[The check passes locally but the shim is stale on another machine]** → Shims are per-machine artifacts; the check asserts against the declared target via `realpathSync`, so a stale link on any machine fails there rather than passing silently. Re-running `npm install` is the remedy.
- **[Two mappings drift again]** → D3's cross-topology comparison is the guard; it fails on divergence instead of trusting that a rename touched both files.
- **[Check false-positives on a partial checkout or CI cache]** → D5 skips shim verification when `node_modules/.bin` is absent; declaration-only checks are path-based and do not need the tree installed.
- **[Docs correction expands into a broader doc sweep]** → Scope is limited to the five files named in the proposal's Impact; any further `packages/engine` references belong to the separate stale-path cleanup.

## Migration Plan

Single commit, no runtime migration:

1. Add the workspace `bin`, run `npm install` to regenerate the lockfile and shim.
2. Add the check and its root script; confirm it passes on the repaired tree and fails when the shim is temporarily removed.
3. Correct the doc paths and add the README entry-point section.

Rollback: revert the commit. The root `bin` block is untouched, so the npx-from-git path is unaffected either way; only the local shim disappears.

## Open Questions

None. The one deferrable item — whether `leapscore-scan` should become `leapscore` — is an explicit non-goal with its own tracking note.
