/**
 * apps/scanner — standalone produce-side service (scanner-service spec).
 * Owns target ingestion, the unified scan, terminal scoring, envelope
 * sealing, and the versioned NDJSON scan protocol. Stateless: no permanent
 * disk, no served reports, no report permalinks — the terminal `report`
 * frame is the sole scan artefact. Artefact persistence lives in the
 * workflow artifact (`envelope.json`) + future site backend, never here.
 * No website code runs here; no site code runs scans.
 */
export * from "./protocol.js";
export * from "./admission.js";
