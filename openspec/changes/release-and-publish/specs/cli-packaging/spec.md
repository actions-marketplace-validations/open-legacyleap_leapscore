## MODIFIED Requirements

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

## ADDED Requirements

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
