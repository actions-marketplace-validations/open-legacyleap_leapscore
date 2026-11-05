## MODIFIED Requirements

### Requirement: Command entry point resolves after a workspace install

A fresh `npm install` at the repo root SHALL produce a resolving `node_modules/.bin/<command>` shim for every command the repo documents, each shim's target SHALL be an existing file, and the shim SHALL **execute** — invoking the command's `--help` after a clean install SHALL print its usage without an interpreter or toolchain error. A documented command whose shim is absent, dangling, non-executable, or fails to run SHALL be treated as a defect, not as a fallback to a longer invocation form.

#### Scenario: Scanner command resolves from a clean checkout

- **WHEN** a clean checkout runs `npm install` at the repo root and then `leapscore-scan --help`
- **THEN** the shim resolves to the scanner's built artifact and prints the CLI usage without an error

#### Scenario: A stale shim is a failure, not a fallback

- **WHEN** a shim under `node_modules/.bin` points at a path that does not exist
- **THEN** the wiring is reported as broken and named by its command and its dead target, rather than being satisfied by any equivalent long-form invocation

#### Scenario: Non-executable target is reported

- **WHEN** a shim resolves to an existing file that lacks the executable bit
- **THEN** the wiring is reported as broken and names that file

#### Scenario: A target that cannot run is reported

- **WHEN** a shim's target exists and is executable but fails to run on a machine that has only the declared runtime (for example, a source file requiring an interpreter extension that is not installed)
- **THEN** the wiring is reported as broken and names the command and the failing target

### Requirement: Each install topology exposes the same command set

The repo SHALL expose its commands in both supported topologies — a workspace install (shim under `node_modules/.bin`) and an install of the repo package itself (the `npx -p <repo>#<ref> <command>` form the release workflow and docs use) — and both SHALL map the same command name to the same runnable target: the built artifact for compiled commands, never a source file that depends on a just-in-time toolchain. Neither topology SHALL expose a command the other cannot run.

#### Scenario: Both topologies agree on the target

- **WHEN** the command name `leapscore-scan` is mapped in both the workspace package and the repo package
- **THEN** both mappings resolve to the scanner's built artifact

#### Scenario: Divergent targets are reported

- **WHEN** the repo-package mapping for a command name and the workspace mapping for that same name resolve to different files
- **THEN** the wiring is reported as broken and names both targets

#### Scenario: Repo-package invocation keeps working

- **WHEN** the repo package is installed from a git reference and its command is invoked as `npx -p "<repo>#<ref>" surface`
- **THEN** the command resolves and runs, so removing a workspace-only mapping cannot break that path and adding one cannot shadow it
