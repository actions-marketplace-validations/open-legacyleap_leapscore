## Purpose

Defines how a LeapScore command becomes an executable entry point: which package owns the `bin` mapping in each install topology, what a fresh install must produce, and the repo gate that keeps a command name from silently pointing at a path that no longer exists.

## Requirements

### Requirement: Command entry point resolves after a workspace install

A fresh `npm install` at the repo root SHALL produce a resolving `node_modules/.bin/<command>` shim for every command the repo documents, each shim's target SHALL be a file committed to the checkout rather than a file the install builds, and the shim SHALL **execute** — invoking the command's `--help` after a clean install SHALL print its usage without an interpreter or toolchain error. A documented command whose shim is absent, dangling, non-executable, or fails to run SHALL be treated as a defect, not as a fallback to a longer invocation form.

#### Scenario: Scanner command resolves from a clean checkout

- **WHEN** a clean checkout runs `npm install` at the repo root and then `leapscore-scan --help`
- **THEN** the shim resolves to the scanner's committed command launcher, which runs the built bundle (built by the root `prepare` script) and prints the CLI usage without an error

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

The repo SHALL expose its commands in every supported topology — a workspace install (shim under `node_modules/.bin`), a registry install of the published package (`npx <package> <command>` or a global/local install), and a git install of the repo package (the `npx -p <repo>#<ref> <command>` form) — and all of them SHALL map the same command name to the same runnable target: for compiled commands either the built artifact or a committed Node launcher that execs it, never a source file that depends on a just-in-time toolchain. No topology SHALL expose a command another cannot run, and adding a topology SHALL NOT shadow or repoint an existing one.

#### Scenario: Both topologies agree on the target

- **WHEN** the command name `leapscore-scan` is mapped in the workspace package, the published package, and the repo package
- **THEN** every mapping resolves to the same committed launcher, which runs the scanner's built artifact

#### Scenario: Divergent targets are reported

- **WHEN** any two topologies map the same command name to different files
- **THEN** the wiring is reported as broken and names both targets

#### Scenario: Repo-package invocation keeps working

- **WHEN** the repo package is installed from a git reference and its command is invoked as `npx -p "<repo>#<ref>" surface`
- **THEN** the command resolves and runs, so removing a workspace-only mapping cannot break that path and adding one cannot shadow it

#### Scenario: Registry install does not shadow the workspace shim

- **WHEN** a workspace install and a registry install coexist on one machine
- **THEN** each resolves to its own installed launcher and neither silently redirects the other

### Requirement: Registry install is a first-class command topology

The published package SHALL expose `leapscore-scan` as both its package name and its command name, so `npx leapscore-scan <args>` resolves without a `-p` flag, and installing it SHALL place a launcher that runs the built artifact on a machine with only the declared runtime. The command's stamped engine version SHALL equal the installed package version, and the install SHALL require no repository checkout and no build step.

#### Scenario: One command from an empty directory

- **WHEN** a user runs `npx leapscore-scan --help` in an empty directory with no checkout
- **THEN** the command prints its usage and exits `0`

#### Scenario: Installed version is the release identity

- **WHEN** the installed package reports its version and seals a scan
- **THEN** the sealed `engine_version` equals the installed package version

#### Scenario: No repository checkout is required

- **WHEN** the published package is installed on a machine that has only the declared runtime and `git`
- **THEN** the command resolves and scans without cloning or building the LeapScore repository

### Requirement: One command name maps to one target

A command name SHALL NOT be claimed by two different targets, and a repo-level command mapping SHALL NOT be removed while a documented workflow, Action, or README still invokes that command.

#### Scenario: Duplicate names with different targets are reported

- **WHEN** two packages in the workspace declare the same command name with different targets
- **THEN** the wiring is reported as broken and names the competing packages

#### Scenario: Removing a still-invoked mapping is reported

- **WHEN** a command mapping is dropped while a documented invocation of that command remains in the repo
- **THEN** the wiring is reported as broken and names the command and the invocation site

### Requirement: The wiring check is a repo gate

The repo SHALL provide a single non-interactive check that validates every declared command mapping and every produced shim, SHALL exit non-zero with a per-command diagnostic when any mapping or shim fails the requirements above, and SHALL exit zero with no output noise when all of them pass. The check SHALL NOT require network access, a scan, or a token.

#### Scenario: Healthy wiring passes quietly

- **WHEN** every declared command resolves to an existing executable target in both topologies
- **THEN** the check exits `0` without naming any command

#### Scenario: Broken wiring fails the gate

- **WHEN** any declared command is missing a shim, points at a missing target, or maps to divergent targets across topologies
- **THEN** the check exits non-zero and its output names each failing command with the reason

#### Scenario: Gate runs offline

- **WHEN** the check runs with no network access and no `GH_TOKEN` set
- **THEN** it still completes and reports the same verdict
