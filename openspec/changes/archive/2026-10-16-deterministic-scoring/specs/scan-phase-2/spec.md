## MODIFIED Requirements

### Requirement: Indicator-count-driven budget with uniform sharding
The system SHALL bound scan work deterministically from the **requested indicator list and the target file tree**: `sampleN` SHALL be derived from the sorted file count via uniform file-tree sharding and threaded through every slow detector's lease before fan-out, so all slow detectors shard identically on any machine. Per-detector byte budgets SHALL be partitioned, never drawn from a shared running counter. The wall-clock budget SHALL NOT degrade rows to `unknown` and SHALL NOT trigger a degraded seal: it is a pathological-repo killer only, and when it fires the run SHALL fail loudly (crash semantics) with no partial headline. Deterministic bound hits (`sampleN` truncation, per-detector byte cap) SHALL yield `truncated=true` → `unknown` with "what it takes", and progress pct SHALL derive from completed deterministic work plus completed cost, not from `elapsed/budgetMs` against a deadline.

#### Scenario: Budget scales with list
- **WHEN** requested IDs = 19 MVP (mix of fast/api/slow with clone base)
- **THEN** deterministic bounds are computed from the indicator set and file count; the killer timeout is a fixed generous constant independent of the list

#### Scenario: Dissolve triggers sampled run
- **WHEN** `jscpd` exceeds its deterministic shard and `sampleN` was set from the file count
- **THEN** detector honors `sampleN`, returns `truncated=true`, scorer marks `unknown` with "what it takes", and the headline treats it per the frozen-denominator policy

#### Scenario: Budget exceeded seals degraded report
- **WHEN** the wall-clock killer fires with `ARCH-01` still running
- **THEN** the orchestrator does not seal a degraded report; the run fails loudly with exit `1` and a `budget-exceeded` run-failure reason, and no headline is written (this scenario replaces the former degraded-seal behavior)

#### Scenario: Progress reflects unified budget
- **WHEN** scan runs with 19 indicators over a large tree
- **THEN** progress advances monotonically with completed detectors and completed shard cost, reaching 100% when deterministic work completes

#### Scenario: Killer timeout fails the run
- **WHEN** the wall-clock killer fires with `ARCH-01` still running
- **THEN** the orchestrator does not seal; the CLI exits `1` with a `budget-exceeded` run-failure reason and writes no headline

#### Scenario: Progress reflects deterministic work
- **WHEN** scan runs with 19 indicators over a large tree
- **THEN** progress advances monotonically with completed detectors and completed shard cost, reaching 100% when deterministic work completes
