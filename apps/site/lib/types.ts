/*
 * Report contract — wire shape owned by the producer (`packages/contracts`).
 * Render-only concerns (verdict_text, remediation display) live on the
 * contract's IndicatorRow; this module re-exports the contract so the UI
 * never declares a second authoritative Report.
 */

export type {
  RowStatus,
  RowScore,
  GateStatus,
  EvidencePointer,
  Evidence,
  Basis,
  Remediation,
  IndicatorRow,
  CategoryScore,
  Gate,
  CoverageCounts,
  TopBlocker,
  DeepDiveScopeEntry,
  Report,
  EnvelopeMeta,
  TraceEntry,
  ReportEnvelope,
  ReportIdentity,
  IdentityStatus,
  IdentityItem,
  IdentitySize,
  IdentityLanguage,
} from "@leapscore/contracts";
export { CONTRACT_VERSION } from "@leapscore/contracts";

export interface ReportQuery {
  repo?: string;
}
