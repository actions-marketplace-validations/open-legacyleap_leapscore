## MODIFIED Requirements

### Requirement: Worker/queue clone pipeline
The system SHALL, when the requested indicator set includes any clone-dependent detector, clone the repo shallow (`--filter=blob:none`) within the unified budget via a worker/queue job executed inside the scanner service, run manifest sniff per `{root, ecosystem}[]`, and expose the clone via read-only `readFile` to detectors. The clone SHALL NOT execute in the website process, and the website SHALL have no clone capability. No repo code SHALL be executed. When no clone-dependent indicator is requested, the clone step SHALL be skipped and budget SHALL omit `cloneBaseMs`. The clone step SHALL NOT be surfaced as a separate "Phase 2" in UI or API.

#### Scenario: Shallow clone succeeds
- **WHEN** a unified scan for `https://github.com/vercel/next.js` with 19 requested indicators enqueues work under the ~240s unified budget
- **THEN** worker clones with `--filter=blob:none`, sniff finds `package-lock.json` at `/`, selects JS adapters, and detectors read via `readFile`, all within the same unified budget that also covers GH-API detectors

#### Scenario: No manifest falls back to agnostic plane
- **WHEN** no `package-lock.json`/`pyproject.toml`/`go.mod` found
- **THEN** ECOS/ARCH language-gated rows emit `unknown` with `unknown_measure_path`; scan still seals once at unified deadline with GH-API + file-presence rows

#### Scenario: Clone skipped when not needed
- **WHEN** requested IDs are GH-only (e.g. 6 VEL/SEC/TEST indicators)
- **THEN** scan omits clone, budget uses `base 5s` (not `cloneBase 30s`), and report seals without clone progress

#### Scenario: Clone runs in the scanner service
- **WHEN** a clone-dependent indicator set is scanned and the website process is inspected
- **THEN** the clone is created and read only inside the scanner service, and no clone work, temp directory, or filesystem read occurs in the website
