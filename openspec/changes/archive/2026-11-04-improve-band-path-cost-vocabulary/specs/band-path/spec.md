## MODIFIED Requirements

### Requirement: Cost classification and cumulative arrival

The system SHALL classify every step into exactly one cost class from its verify-effort tag — the thirty-minute class (⚡), the hours class (🔶), and the days class (🔷) — order steps by descending recoverable weight within a class, and present classes in ascending verification effort. A class SHALL be identified by its verify-effort tag and the rows it contains; the path SHALL NOT assign a class a name or a duration that asserts remediation effort, fix cost, or elapsed calendar time. For each class the path SHALL report the cumulative recoverable points and which of three arrival states holds: reached by this class alone, reached only by this class combined with those before it, or not reached. Arrival statements SHALL reference a class by its rows and SHALL NOT reference a remediation or calendar noun. The compact stdout clause SHALL name the crossing class by the same tag identity the report surfaces use.

#### Scenario: Cost classes derive from the tag in ascending verify effort

- **WHEN** a path's candidate steps carry ⚡, 🔶, 🔷, and one unrecognized effort tag
- **THEN** the path presents three classes in ascending verification effort, and the unrecognized tag joins the days class so an unknown cost is never reported as the cheapest

#### Scenario: Sprint class alone crosses

- **WHEN** `points_needed` is 4 and the thirty-minute class totals 6.1 pp
- **THEN** the path states that this class alone reaches the destination, and the statement names the class by its rows and tag rather than by a calendar or remediation noun

#### Scenario: Only cumulative arrival crosses

- **WHEN** `points_needed` is 5, the thirty-minute class totals 4.2 pp, and the hours class totals 2.6 pp
- **THEN** the path states that the first class alone does not reach the destination, that the first two together do, and reports both cumulative figures

#### Scenario: Nothing reachable crosses

- **WHEN** total recoverable points across all classes fall below `points_needed`
- **THEN** the path states that no combination of graded deductions reaches the destination and names unreached-row count as the reason the remainder cannot be covered by graded work

#### Scenario: A class never asserts a duration

- **WHEN** a class is built from ⚡-tagged rows whose remediation text describes multi-day work
- **THEN** the class heading and its arrival statement carry the tag and the row grouping only — no class duration, no per-class total duration, and no statement that the remediation takes the tagged time

#### Scenario: Stdout names the crossing class by tag

- **WHEN** the thirty-minute and hours classes together cross the destination
- **THEN** the compact stdout clause names both classes by their tag identity, identical to the vocabulary the report surfaces render, and does not fall back to an internal cost-class key
