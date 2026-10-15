/**
 * apps/scanner — standalone produce-side service (scanner-service spec).
 * Owns target ingestion, the unified scan, terminal scoring, envelope
 * sealing, the versioned NDJSON scan protocol, report permalinks, and the
 * canonical report store. No website code runs here; no site code runs scans.
 */
export * from "./protocol.js";
export * from "./store.js";
export * from "./admission.js";
