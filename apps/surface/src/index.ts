/** apps/surface/src/index.ts — public barrel for the standalone surface app. */
export { runSurface } from './sync';
export type {
  RunSurfaceInput,
  SurfaceEnvelope,
  SurfaceMeta,
  SurfaceResult,
  SurfaceRunner,
  SurfaceTarget,
} from './sync';
export { formatSummaryLine } from './summary';
export type { SurfaceCounts } from './summary';
export type { SurfaceRestClient } from './rest';
