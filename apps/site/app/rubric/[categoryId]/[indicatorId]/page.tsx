import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SAMPLE_ROW_INDEX } from "@/lib/generated/samples";
import {
  CATEGORY_LABELS,
  type IndicatorMeta,
} from "@/lib/generated/rubric";
import { isIndicatorImplemented } from "@/lib/generated/coverage";
import {
  categoryEntries,
  codeForPrefix,
  firstRowLink,
  registryEntries,
} from "@/lib/rubric-index";
import { categoryHref, categoryPrefix, indicatorHref } from "@/lib/rubric-links";

export const dynamicParams = false;

export function generateStaticParams(): {
  categoryId: string;
  indicatorId: string;
}[] {
  return registryEntries().map((entry) => ({
    categoryId: categoryPrefix(entry.category),
    indicatorId: entry.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string; indicatorId: string }>;
}): Promise<Metadata> {
  const { indicatorId } = await params;
  const entry = registryEntries().find((candidate) => candidate.id === indicatorId);
  return {
    title: entry ? `${entry.id} ${entry.name} | Rubric` : "Rubric",
    description: entry?.definition,
  };
}

const CONTENTS = [
  { id: "definition", label: "Definition" },
  { id: "why", label: "Why it matters" },
  { id: "manifests", label: "Where it manifests" },
  { id: "detection", label: "Detection method" },
  { id: "flags", label: "Flags" },
  { id: "criteria", label: "0–3 criteria" },
  { id: "remediation", label: "Remediation" },
  { id: "applicability", label: "Applicability" },
  { id: "statusing", label: "Statusing" },
  { id: "score-mapping", label: "Score mapping" },
  { id: "fact-schema", label: "Fact schema" },
  { id: "evidence", label: "Evidence" },
  { id: "scope", label: "Scope/overlaps" },
  { id: "gates", label: "Gates fed" },
] as const;

const CRITERIA_LEVELS = [
  { level: "3", label: "Healthy" },
  { level: "2", label: "Minor debt" },
  { level: "1", label: "Severe debt" },
  { level: "0", label: "Critical" },
] as const;

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="scroll-mt-20 text-sm font-semibold tracking-wider text-faint uppercase"
    >
      {children}
    </h2>
  );
}

/** A neutral panel. Rubric surfaces use no color outside the neutral and band tokens. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-lg border border-hairline bg-panel/50 p-4 text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-background/70 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-muted">
      {children}
    </pre>
  );
}

function PrevNext({
  entry,
  entries,
}: {
  entry: IndicatorMeta;
  entries: IndicatorMeta[];
}) {
  const index = entries.findIndex((candidate) => candidate.id === entry.id);
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null;
  return (
    <nav
      aria-label="Indicator navigation"
      className="mt-10 flex flex-wrap justify-between gap-3 border-t border-hairline pt-4 text-sm"
    >
      <span>
        {previous ? (
          <Link
            href={indicatorHref(previous.id)}
            className="cursor-pointer underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            ← {previous.id} {previous.name}
          </Link>
        ) : null}
      </span>
      <span>
        {next ? (
          <Link
            href={indicatorHref(next.id)}
            className="cursor-pointer underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
          >
            {next.id} {next.name} →
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

export default async function IndicatorPage({
  params,
}: {
  params: Promise<{ categoryId: string; indicatorId: string }>;
}) {
  const { categoryId, indicatorId } = await params;
  const code = codeForPrefix(categoryId);
  if (!code) notFound();
  const entry = registryEntries().find((candidate) => candidate.id === indicatorId);
  if (!entry || entry.category !== code) notFound();

  const entries = categoryEntries(code);
  const implemented = isIndicatorImplemented(entry.id);
  const evidenceLink = firstRowLink(SAMPLE_ROW_INDEX, entry.id);
  const categoryName = CATEGORY_LABELS[code] ?? code;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-faint">
        <Link
          href="/rubric"
          className="cursor-pointer rounded underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          Rubric
        </Link>{" "}
        /{" "}
        <Link
          href={categoryHref(code)}
          className="cursor-pointer rounded underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          {categoryId} {categoryName}
        </Link>{" "}
        / <span className="text-muted">{entry.id}</span>
      </nav>

      <header className="mt-4">
        <p className="font-mono text-xs text-faint">{entry.id}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {entry.name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-faint">
          <span className="rounded border border-hairline bg-panel-raised px-1.5 py-0.5 font-mono">
            tier {entry.tier}
          </span>
          <span className="rounded border border-hairline bg-panel-raised px-1.5 py-0.5 font-mono">
            default {entry.default_status}
          </span>
          <span className="rounded border border-hairline bg-panel-raised px-1.5 py-0.5 font-mono">
            rollup {entry.rollup}
          </span>
          <span className="rounded border border-hairline bg-panel-raised px-1.5 py-0.5 font-mono">
            v1 {entry.v1}
          </span>
          <span className="rounded border border-hairline bg-panel-raised px-1.5 py-0.5 font-mono">
            effort {entry.effort}
          </span>
          {implemented ? (
            <span className="rounded border border-hairline bg-foreground px-1.5 py-0.5 font-mono text-background">
              implemented in this release
            </span>
          ) : (
            <span className="rounded border border-dashed border-hairline px-1.5 py-0.5 font-mono">
              not implemented in this release
            </span>
          )}
        </div>
        {!implemented ? (
          <p className="mt-3 rounded-lg border border-hairline bg-panel/50 p-3 text-xs leading-relaxed text-muted">
            No detector ships for this indicator in this release. The rubric
            definition is canonical and citable, but this page makes no score,
            verdict, or measurement claim for it.
          </p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="On this page"
          className="h-fit rounded-lg border border-hairline bg-panel/40 p-3 lg:sticky lg:top-20"
        >
          <p className="text-[11px] tracking-wider text-faint uppercase">
            On this page
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {CONTENTS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block cursor-pointer rounded px-1 py-0.5 text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground/40"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="space-y-8">
          <section>
            <SectionHeading id="definition">Definition</SectionHeading>
            <Panel>{entry.definition}</Panel>
          </section>

          <section>
            <SectionHeading id="why">Why it matters</SectionHeading>
            <Panel>{entry.why}</Panel>
          </section>

          <section>
            <SectionHeading id="manifests">Where it manifests</SectionHeading>
            <Panel>{entry.manifests}</Panel>
          </section>

          <section>
            <SectionHeading id="detection">Detection method</SectionHeading>
            <Panel>{entry.detection}</Panel>
          </section>

          <section>
            <SectionHeading id="flags">Flags</SectionHeading>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-hairline bg-panel/50 p-4">
                <p className="text-[11px] font-medium tracking-wider text-faint uppercase">
                  Yellow flag (warning)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {entry.yellow}
                </p>
                <p className="mt-2 border-t border-hairline pt-2 text-xs leading-relaxed text-faint">
                  <span className="text-muted">Rationale.</span>{" "}
                  {entry.yellow_rationale}
                </p>
              </div>
              <div className="rounded-lg border border-hairline bg-panel/50 p-4">
                <p className="text-[11px] font-medium tracking-wider text-faint uppercase">
                  Red flag (critical)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {entry.red}
                </p>
                <p className="mt-2 border-t border-hairline pt-2 text-xs leading-relaxed text-faint">
                  <span className="text-muted">Rationale.</span>{" "}
                  {entry.red_rationale}
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading id="criteria">0–3 criteria</SectionHeading>
            <ol className="mt-2 space-y-2">
              {CRITERIA_LEVELS.map(({ level, label }) => (
                <li
                  key={level}
                  className="flex gap-3 rounded-lg border border-hairline bg-panel/50 p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-hairline bg-panel-raised font-mono text-sm text-foreground">
                    {level}
                  </span>
                  <span className="text-sm leading-relaxed text-muted">
                    <span className="text-foreground">{label}.</span>{" "}
                    {entry.criteria[level as "3" | "2" | "1" | "0"]}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <SectionHeading id="remediation">Remediation</SectionHeading>
            <div className="mt-2 space-y-3">
              <Panel>
                <span className="text-foreground">Quick win.</span>{" "}
                {entry.remediation.quick_win}
              </Panel>
              <Panel>
                <span className="text-foreground">Structural fix.</span>{" "}
                {entry.remediation.structural || "None stated."}
              </Panel>
              <Panel>
                <span className="text-foreground">Gold standard.</span>{" "}
                {entry.remediation.gold_standard}
              </Panel>
            </div>
          </section>

          <section>
            <SectionHeading id="applicability">Applicability</SectionHeading>
            <Panel>
              {entry.applicability ?? "The catalog states no applicability clause for this indicator."}
            </Panel>
          </section>

          <section>
            <SectionHeading id="statusing">Statusing</SectionHeading>
            <Pre>{entry.statusing}</Pre>
          </section>

          <section>
            <SectionHeading id="score-mapping">Score mapping</SectionHeading>
            <Panel>
              <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {entry.score_mapping}
              </div>
            </Panel>
          </section>

          <section>
            <SectionHeading id="fact-schema">Fact schema</SectionHeading>
            <Pre>{entry.fact_schema}</Pre>
          </section>

          <section>
            <SectionHeading id="evidence">Evidence</SectionHeading>
            <Pre>{entry.evidence}</Pre>
            <p className="mt-2 text-xs text-faint">
              Budget class: {entry.budget_class ?? "not stated in the catalog"}.
            </p>
            {evidenceLink ? (
              <p className="mt-3 text-sm">
                <Link
                  href={`/samples/${evidenceLink.slug}/#${evidenceLink.anchor}`}
                  className="cursor-pointer underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                >
                  See {entry.id} in the committed sample report
                </Link>
                <span className="text-faint"> — illustrative evidence.</span>
              </p>
            ) : (
              <p className="mt-3 text-xs text-faint">
                No committed sample report carries this indicator, so no
                evidence link is offered.
              </p>
            )}
          </section>

          <section>
            <SectionHeading id="scope">Scope/overlaps</SectionHeading>
            <Panel>{entry.scope}</Panel>
          </section>

          <section>
            <SectionHeading id="gates">Gates fed</SectionHeading>
            <Panel>
              {entry.gates.length
                ? `${entry.gates.join(", ")} — the triggers are canonical in the method page's gate roster.`
                : "This indicator feeds no kill-switch gate."}
            </Panel>
          </section>
        </article>
      </div>

      <PrevNext entry={entry} entries={entries} />

      <p className="mt-4 text-xs text-faint">
        <Link
          href={categoryHref(code)}
          className="cursor-pointer underline underline-offset-2 hover:text-foreground"
        >
          ← All {categoryId} indicators
        </Link>
      </p>
    </div>
  );
}
