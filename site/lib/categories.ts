/*
 * Category metadata — single source for the 10 categories across the site.
 * Weights live on the category rows; FE is scored only when a repo has a
 * real client (weight set applied in CODEDEBT_AUDIT_RUBRIC/11 §1, decision C1).
 */

import type { CategoryId } from "@/lib/scoring";
import { BASE_WEIGHTS } from "@/lib/scoring";

export interface CategoryMeta {
  id: string;
  name: string;
  one_liner: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "ECOS",
    name: "Dependency & Ecosystem",
    one_liner: "EOL pressure, drift, abandonment, bloat, licenses.",
  },
  {
    id: "ARCH",
    name: "Architecture",
    one_liner: "God classes, coupling, boundaries, hot spots, globals.",
  },
  {
    id: "TEST",
    name: "Testing",
    one_liner: "Coverage, flakiness, pyramid balance, gates.",
  },
  {
    id: "SEC",
    name: "Security",
    one_liner: "CVEs, secrets, authz, audit trails, compliance drift.",
  },
  {
    id: "DATA",
    name: "Data & Schema",
    one_liner: "Migrations, constraints, ORM smells, model rigidity.",
  },
  {
    id: "API",
    name: "API surface",
    one_liner: "Contract drift, versioning, sync coupling, error semantics.",
  },
  {
    id: "VEL",
    name: "Velocity",
    one_liner: "Build time, deploy cadence, bus factor, PR hygiene.",
  },
  {
    id: "PERF",
    name: "Performance",
    one_liner: "Observability, scaling, resource waste, SLOs.",
  },
  {
    id: "DOCS",
    name: "Documentation",
    one_liner: "ADRs, runbooks, onboarding, tribal knowledge.",
  },
  {
    id: "FE",
    name: "Front-end",
    one_liner: "Applied only to repos with a real client.",
  },
];

/** base-set percent weight; `null` for FE (C1: never scored standalone). */
export function weightFor(id: string): number | null {
  return id === "FE" ? null : BASE_WEIGHTS[id as CategoryId];
}
