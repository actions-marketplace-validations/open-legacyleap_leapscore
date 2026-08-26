/** engine/store.ts — fact-store (05 §6, §7) */
// Append-only RawFact per (scanId, detectorId, root), validated against schema.json.
// Every fact carries tool+version+flags, commit sha, scanId, schemaVersion, root, duration.
// Replay: Facts[] + rubric.json@sha -> scorer without re-scan.
// Stub.

export type StoreKey = { scanId: string; detectorId: string; root: string };
export async function putFact(_key: StoreKey, _fact: unknown): Promise<void> {}
export async function getFacts(_scanId: string): Promise<unknown[]> { return []; }
