## 1. Curate the artifacts

- [x] 1.1 Create `docs/diagrams/` and copy each of the nine `.archify/<type>-<slug>-<timestamp>/candidate.json` to `docs/diagrams/<type>-<slug>.json`, dropping the timestamp; verify with `ls docs/diagrams/*.json | wc -l` returning 9 and every filename matching `^(architecture|class|dataflow|erd|lifecycle|sequence|tree|timeline|waterfall|workflow)-[a-z0-9-]+\.json$`
- [x] 1.2 Copy each `<slug>.html` to `docs/diagrams/<type>-<slug>.html` with the stem of its spec; verify every `.json` has a same-stem `.html` and vice versa
- [x] 1.3 Rewrite `meta.output` in each of the nine specs to its new path; verify by re-rendering one spec with `archify render <type> docs/diagrams/<stem>.json <tmp>.html --quality showcase --repo-root .` and confirming the `sha256` equals the committed HTML (expected: byte-identical, since `meta.output` is not embedded)
- [x] 1.4 Re-render all nine specs and confirm all nine `sha256` values match their committed HTML before any working file is deleted
- [x] 1.5 Delete the `.archify/` working directory and confirm `git status --porcelain` reports no deleted tracked files and no untracked `.archify` entry
- [x] 1.6 Add `.archify/` to `.gitignore`; verify `git check-ignore -v .archify` resolves and a fresh `archify` run would not appear in `git status`

## 2. Index and refresh

- [x] 2.1 Write `docs/diagrams/README.md` with an index table (diagram link, what it answers, archify type, pinned revision), the authority statement (*illustrative snapshots, not a requirements source*), the provenance line (*all nine passed `finalize` + `browser-check` on archify 3.2.0*), and the drift warning that the pin predates the current HEAD; verify `npm run check:documentation-structure` still passes, which proves every local link resolves
- [x] 2.2 Write `docs/diagrams/refresh.sh` that re-renders every spec with `archify render … --quality showcase --repo-root .` and reports per-file `MATCH`/`DIFF`; verify it runs from the repository root and exits 0 with nine `MATCH` lines on an unchanged tree
- [x] 2.3 Verify the refresh script's failure path by editing one spec's `meta.title` in a scratch copy and confirming the script reports a `DIFF` rather than silently rewriting the artifact

## 3. Documentation entry points

- [x] 3.1 Add a `docs/diagrams/` bullet to the "Documentation areas" list in `docs/README.md` with an `Illustrative only` authority line, and confirm the existing "Source ownership" table does not now contradict it
- [x] 3.2 Update `AGENTS.md` so the "Two live doc trees" heading and its bullet list account for `docs/diagrams/` as a third, non-authoritative area; verify no remaining sentence claims the docs tree has exactly two areas
- [x] 3.3 Confirm `npm run check:documentation-structure` passes, which also proves the `AGENTS.md` links resolve

## 4. Structural guard

- [x] 4.1 Write `tooling/checks/diagrams.ts` enforcing: matched stems in both directions, no timestamp or non-kebab segment, no receipt-shaped filename, index completeness plus its three required statements, revision agreement across index / spec / HTML source evidence, `.archify/` ignored, and no site route or published asset referencing `docs/diagrams/`; verify it exits 0 on the curated tree
- [x] 4.2 Prove each rule fails on a planted violation (unpaired file, timestamped name, copied `*.finalize.json`, mismatched revision row, removed `.gitignore` entry) and that the message names the offending path
- [x] 4.3 Wire `check:diagrams` into root `package.json` alongside the existing `check:*` scripts and into the same CI job that runs them; verify `npm run check:diagrams` resolves from the root after a clean install

## 5. Verification

- [x] 5.1 Run the full boundary roster from the root (`check:documentation-structure`, `check:schemas`, `check:rubric-consistency`, `check:detector-isolation`, `check:site-boundary`, `check:bin-wiring`, `check:dist`, `check:diagrams`) and confirm every one passes
- [x] 5.2 Confirm the committed set contains no receipt file and no absolute path: `git grep -l "/Users/" -- docs/diagrams` returns nothing, and `git ls-files docs/diagrams` lists exactly 20 files (9 `.html`, 9 `.json`, `README.md`, `refresh.sh`)
- [x] 5.3 Record the packed cost of the new set in the change's completion note and compare it against the 2.30 MiB measured in `design.md`; a large divergence means the artifacts were copied with a different archify version

## Completion note

- **Set size**: 20 files — 9 `.html`, 9 `.json`, `README.md`, `refresh.sh`; 7.6 MB in the worktree.
- **Packed cost**: 24 git objects. Loose (zlib, no delta) = **2.32 MiB**, matching `design.md`'s 2.30 MiB within 1%; after `git gc` delta-compression = **287.94 KiB** (the nine near-identical archify runtimes delta to almost nothing against each other). The divergence from 2.30 MiB is the measurement method — loose-object size versus a packed size — not a version change.
- **Version check**: every committed `.html` carries `<meta name="generator" content="archify 3.2.0">`, and all nine re-render byte-identically from the committed specs (`refresh.sh`: 9 matched, 0 differed). Same tool version, same artifact set.
- **CI**: no pre-existing job ran the `check:*` roster, so `check:diagrams` runs in the new `.github/workflows/checks.yml` alongside the full roster (see task 4.3).
