/** checks/detector-isolation.ts — ban raw fs/fetch in detectors (05 §5, Q8) */
// Lints detectors/*/detector.ts — forbids fs, fetch, axios, net, child_process.exec(repoPath).
// Allowed: ctx.readFile, ctx.gh, ctx.llm, ToolAdapter via engine/runner.ts.
// Stub.
