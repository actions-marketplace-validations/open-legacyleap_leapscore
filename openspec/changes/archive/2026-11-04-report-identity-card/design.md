## Context

See `proposal.md` — Why. Two pieces of the current state shape the approach:

- The identity material is already produced but reaches no rendered surface. `walkSortedTree` (`apps/scanner/src/scan/tree.ts`) yields the canonical sorted path list; `classifyArchetype` (`archetype.ts`) yields archetype, confidence, planes, and per-root entries; `sniffEcosystems` (`ecosystem.ts`) yields manifests; `scanStackCensus` (`stackcensus.ts`) yields the VB6/Delphi census. Only `archetype` and `planeInventory` are sealed, into `report.snapshot`, and only as an unreached chip.
- The scan has two lanes with different read capability. `shallowClone` (`clone.ts`) is `--filter=blob:none --depth 1` with a 4 MB default byte cap; `bindLocalReadFile` (`local.ts`) reads a local disk. So history-derived values are structurally unavailable remotely, and any content measurement is a budget decision remotely and free locally.

Display grammar for contract-owned statements already has a home: `gateCapStatement` and `bandPathBlock` live in `packages/contracts` and are imported by both the site and the CLI.

## Goals / Non-Goals

**Goals:**

- One optional sealed identity block, producer-computed, consumer-rendered without re-derivation.
- A membership rule that is checkable in review and in a test, not a matter of taste.
- A line magnitude that is honest at three levels of certainty and never enters the score.
- Section order that puts the subject before the verdict on every rendered surface, with the instrument's receipt demoted rather than deleted.

**Non-Goals:**

- Observing popularity, vitality, or history (stars, contributors, repo age, last activity).
- Any decomposition of the line magnitude (code/comment/blank), any per-file distribution, any comment ratio.
- Refactoring the eight existing `walkSortedTree` call sites. Identity adds a pass; consolidating the walk is a separate change with its own risk profile.
- Changing weights, bands, gates, indicators, or the compiled rubric. `docs/rubric/**` gains nothing.

## Decisions

### D1 — The block lives at `report.identity`, not in `snapshot` or `meta`

`snapshot` already carries `archetype` and `planeInventory`, and both are *inputs to grading*: `seal.ts` passes them to `evaluateApplicability` and `scoreMvp`. Adding presentation-only values beside graded inputs invites the next reader to assume they are also inputs. `meta` is the list-view index with a hard contract that the list reads `meta` alone; putting a multi-field block there would either bloat every list row or force the list to parse it.

`report.identity` is the third derived-and-excluded block, next to `next_band_path`. Its exclusion semantics are the same, so there is one precedent to cite rather than a new one to invent.

*Alternatives:* extend `snapshot` (rejected: mixes graded inputs with presentation, and `identity.archetype` would sit next to the `snapshot.archetype` that actually feeds applicability); extend `meta` (rejected: breaks the list-view boundary and the "list never opens the body" scenario).

### D2 — Identity is a scan-driver pass, not a detector

`classifyArchetype` is the precedent: computed in `orchestrator.ts` / `local.ts`, carried on `_archMeta`, sealed into the report, never declared in the detector registry. Identity follows it exactly.

Routing identity through `ctx.readFile` under `partitionByteCap` would have two bad properties: its read failures would be indistinguishable from detector cap failures (both surface as `QuotaExceededError`), and its cost would be invisible to `budgetForIndicators`.

Its allocation is therefore reserved **before** the remainder is partitioned, on the `withCloneBase` precedent — fixed work gets a base, indicator-derived work gets the rest. The allocation is a named constant, not a fraction of the deadline, so identity cost does not vary with the indicator slice.

*Alternatives:* a pseudo-detector that grades nothing (rejected: the registry is the list of things that produce rows; an entry that never produces a row breaks that invariant and would show up in coverage arithmetic); piggybacking on existing detector reads (rejected: identity would then vary with the slice, so `ECOS-01` being out of the slice would silently remove the framework list).

### D3 — Slice independence is a hard requirement for every identity field

Everything identity reports must be derivable from `(tree, manifests, git metadata already in hand)` and nothing else. No field may read a detector's emitted facts.

This is why frameworks are **presence-only** (manifest dependency names against a small curated map) and carry no version and no support status. `ECOS-01` already emits `{name, version, support_status}` and judges end-of-life; identity names the stack and stops. Two producers touch the same manifest, but they publish different facts for different purposes, and neither reads the other.

*Alternative:* reuse `ECOS-01`'s framework facts (rejected: slice dependence, and it would import an EOL judgement into an unscored block).

### D4 — Line magnitude: physical newlines over a named inclusion scope

Definition: count of `\n` over files whose extension matches the source-scope rule, excluding lockfiles, `*.min.*`, generated markers, and vendored directories.

Inclusion list over exclusion list because an exclusion list needs binary detection and text/binary heuristics to be correct, while an inclusion list is enumerable, testable, and its omissions are visible in the scope identifier. The list is seeded from extensions already recognized elsewhere in the scanner (`SOURCE_EXT` in `sourcefiles.ts`, the stack-census extension sets) plus the non-JS languages the scanner already parses.

The scope is versioned as an identifier (`source-v1`) recorded on the item. Adding a language later bumps the identifier, which is how a future differ distinguishes "the rule changed" from "the repo changed".

Physical rather than source/SLOC: SLOC needs per-language comment syntax for eight ecosystems, which is exactly the kind of per-language table that drifts. And an SLOC number is one step from a comment ratio, which is `DOCS-06`'s graded subject.

*Alternatives:* SLOC (rejected: per-language comment syntax, and it invites decomposition); logical statements (rejected: needs a parser per ecosystem); all text files regardless of extension (rejected: lockfiles and fixtures dominate, and binary detection is unreliable); no line count, size band only (kept as a fallback for `unknown`, not the primary form).

### D5 — The ladder keys off coverage, not remaining budget

```
read k files, fixed stride over the canonical sorted walk
  files_in_scope <= k        -> read all          -> measured
  files_in_scope >  k        -> read k, extrapolate -> estimated
  read could not complete    ->                      unknown + reason
```

`k` and the per-file read cap are named constants. Because `k` is fixed and `files_in_scope` is a property of the tree, status cannot flip between two runs of the same content at different indicator counts. A small repo needs no special case: it simply reads everything.

Extrapolation weights the sampled line density by the extension histogram of the whole tree — which the identity pass already has for free from the paths. The stride is what keeps the sample from being the alphabetically-first directory.

*Alternatives:* exact-when-it-fits (rejected: `measured` would mean "we had spare budget", which is unstatable to a reader and unreliable in CI); always-estimate-remotely (rejected: throws away a genuinely measured number on small targets for no gain once `k` is fixed); GH linguist bytes ÷ assumed line length (rejected: linguist bytes are whole-repo, not source-scoped, so `bytes` and `lines` would carry different scopes in one card).

### D6 — Status is emitted; presentation is derived from it

The producer emits `status` and never expects a consumer to recompute it. But the *presentation* of status — the `~` marker and the two-significant-figure rounding — is derived at render, in one place, in `packages/contracts`, following `gateCapStatement` / `bandPathBlock`.

That gives three properties for free: site and CLI cannot disagree, a fixture cannot hand-write `~420k` and make the report lie, and the JSON keeps the exact magnitude while the screen shows a magnitude a reader can hold.

Stored precision follows status: `estimated` stores two significant figures, so nobody quotes false precision out of the JSON.

### D7 — Fingerprint exclusion is forced

`score_fingerprint` hashes sorted facts plus release identity plus semantic flags. The same commit measured locally and estimated remotely would hash differently, breaking "identical content + identical release ⇒ identical fingerprint". Identity is therefore excluded for the same reason `next_band_path` is, and the design adds no fingerprint input.

### D8 — Provenance demotion is a move, not a deletion

The `SCHEMA · RUBRIC · ENGINE · COMMIT · RUN · DURATION · RAN` grid currently sits above the headline with raw-JSON and rerun affordances. It becomes a collapsed provenance band below the evidence sections, keeping every value, the raw-JSON link, and the rerun action. The commit moves into the identity card, where it belongs, and is not repeated above the headline.

The archetype chip and its `[change]` override affordance stay where they are: the chip is a *control*, the card is a *statement*, and both read the same sealed `snapshot.archetype`, so there is one value and no second source of truth.

### D9 — The identity pass reuses the canonical walk; it does not own a new one

The pass calls `walkSortedTree` once and hands the path list to the census, so a scan invokes the walk nine times instead of eight. Consolidating the other call sites is explicitly out of scope: they run inside detectors under budget leases, and touching them changes detector read accounting.

## Risks / Trade-offs

- **The card accretes health metrics until it is a second scorecard.** → The membership rule is stated in the spec as a rejection test, and a contracts-level test asserts that no identity field name matches a graded metric's name (`transitive`, `direct_deps`, `test_files`, `comment_ratio`, `loc_p95`, `max_file_loc`). Review asks "does any indicator grade this?" before adding a field.
- **Line-count scope drift reads as a repo change.** → Scope identifier on the item; identity excluded from the differ's code-attributable set; a change to the rule bumps the identifier.
- **Fixed-stride sampling is biased if the tree is path-sorted by concern.** → Disclose `covered`; the value's job is magnitude, and a stride over a canonical walk is materially better than a prefix. The alternative — read nothing — is strictly worse.
- **Identity costs time on the critical path.** → Reserved, named, capped allocation; the pass never blocks sealing (a failure yields `unknown`, never a failed run), and it runs alongside the other pre-scoring work.
- **A third surface drifts from the other two.** → One formatting function in contracts; site and CLI both import it; the CLI's markdown block gains a test that mirrors the site's.
- **The site boundary check trips.** → The card component reads sealed values only: no `node:fs`, no `apps/scanner` import, no provider call.
- **`0 files` misreads as a broken report.** → Empty scope is `unknown` with a reason, and the archetype beside it explains a docs-only or infra-only target.

## Migration Plan

1. Contract first: `ReportIdentity` types plus `Report.identity?`, and the formatting helpers. Optional member ⇒ no breaking change; older envelopes and the committed fixture still typecheck.
2. Scanner pass behind the same release: local lane measured, remote lane per the ladder. Seal it, and add the fingerprint test that proves two lanes agree.
3. Regenerate the committed fixture and `apps/site/lib/sample.ts` so the sample report exercises `measured`, `estimated`, and `unknown` in one card.
4. Site: card above the hero, provenance demoted, archetype chip retained.
5. CLI: identity line above the verdict; rebuild `dist` and run `check:dist`.
6. Rollback is deleting the block at seal time; every consumer already tolerates absence, which is the same path used for pre-change envelopes.

## Open Questions

- The sample size `k` and the per-file read cap are named constants with no spec-level consequence: tuning them changes a value and its status, never the contract or the rules. Start conservative and measure.
- Whether the run-history list eventually shows a compact identity summary (`language · size`) is deferrable and would be a `report-envelope` change of its own; the list-view boundary means it must come from `meta`, which this change deliberately does not touch.
