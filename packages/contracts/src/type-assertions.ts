/**
 * packages/contracts/src/type-assertions.ts — compile-time invariants for the
 * delta/envelope split (run-diff 1.3). This module emits no runtime code; it
 * fails `tsc --noEmit` if the split ever breaks — a delta document becoming
 * assignable to the envelope type would make a derived comparison readable as
 * a sealed report by a consumer that only checks shapes.
 */
import type {
  ComparabilityBlockingCause,
  ComparabilityVerdict,
  DeltaDocument,
  DeltaKind,
  DeltaTransition,
  ReportEnvelope,
} from "./index";

type IsAssignable<A, B> = A extends B ? true : false;
type MustBeFalse<T extends false> = T;
type MustBeTrue<T extends true> = T;

/** True for a literal union, false when the type widened to `string`. */
type IsClosedUnion<T extends string> = string extends T ? false : true;

/**
 * Fails to compile when a `DeltaDocument` is assignable to `ReportEnvelope`.
 * A delta carries no `meta`, no `report`, and no `trace`, so it can never be
 * passed where an envelope is expected.
 */
export type DeltaIsNotAnEnvelope = MustBeFalse<IsAssignable<DeltaDocument, ReportEnvelope>>;

/** The converse: a sealed envelope is not a comparison document either. */
export type EnvelopeIsNotADelta = MustBeFalse<IsAssignable<ReportEnvelope, DeltaDocument>>;

/** The delta kind vocabulary is closed — an unknown kind is a type error, not
 * a string that flows through. */
export type DeltaKindsAreClosed = MustBeTrue<IsClosedUnion<DeltaKind>>;

/** Same for the transition vocabulary. */
export type TransitionsAreClosed = MustBeTrue<IsClosedUnion<DeltaTransition>>;

/** Same for the verdict and its blocking causes. */
export type VerdictsAreClosed = MustBeTrue<IsClosedUnion<ComparabilityVerdict>>;
export type BlockingCausesAreClosed = MustBeTrue<IsClosedUnion<ComparabilityBlockingCause>>;

/** Kept as a value so the file is a real module under `isolatedModules`. */
export const TYPE_ASSERTIONS_ARE_COMPILE_TIME_ONLY = true;
