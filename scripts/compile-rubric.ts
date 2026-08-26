/** scripts/compile-rubric.ts — canonical markdown -> engine/rubric.json (05 §7, Q6b) */
// Parses CODEDEBT_AUDIT_RUBRIC/11_WEIGHTS_THRESHOLDS_CONFIG.md + 01_*.md..10_*.md
// and per-indicator Yellow/Red thresholds (encyclopedia Scoring criteria 0-3 rows).
// Output: engine/rubric.json with { rubricVersion: sha, weights {base, feActive}, tiers, indicators[] }.
// CI: check:rubric-consistency asserts engine/rubric.json matches canonicals — the AGENTS.md consistency lint that did not exist as script.
// Stub — wiring point.

console.log('stub: compile-rubric — implement markdown parsing + sha + write engine/rubric.json');
