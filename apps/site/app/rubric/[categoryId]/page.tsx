import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CATEGORY_ORDER,
  type IndicatorMeta,
} from "@/lib/generated/rubric";
import {
  categorySummaries,
  categoryEntries,
  codeForPrefix,
} from "@/lib/rubric-index";
import { categoryHref, indicatorHref } from "@/lib/rubric-links";

export const dynamicParams = false;

export function generateStaticParams(): { categoryId: string }[] {
  return categorySummaries().map((category) => ({ categoryId: category.prefix }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const code = codeForPrefix(categoryId);
  const category = categorySummaries().find((entry) => entry.code === code);
  return { title: category ? `${category.name} | Rubric` : "Rubric" };
}

function gatesCell(entry: IndicatorMeta): string {
  return entry.gates.length ? entry.gates.join(", ") : "—";
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const code = codeForPrefix(categoryId);
  if (!code) notFound();
  const category = categorySummaries().find((entry) => entry.code === code);
  if (!category) notFound();
  const entries = categoryEntries(code);
  const baseWeight =
    category.baseWeight == null ? "—" : `${category.baseWeight}%`;
  const feWeight =
    category.feActiveWeight == null ? "—" : `${category.feActiveWeight}%`;
  const position = CATEGORY_ORDER.findIndex((entry) => entry === code);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-faint">
        <Link
          href="/rubric"
          className="cursor-pointer rounded underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
        >
          Rubric
        </Link>{" "}
        / <span className="text-muted">{category.prefix}</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs tracking-wider text-faint uppercase">
          {category.prefix} · {category.count} indicators
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {category.name}
        </h1>
        {category.entries[0] ? (
          <p className="mt-1 font-mono text-xs text-faint">
            {category.code} · weight {baseWeight} base / {feWeight} FE-active
          </p>
        ) : null}
        <blockquote className="mt-4 border-l-2 border-hairline pl-3 text-sm leading-relaxed text-muted">
          {category.thesis}
        </blockquote>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          {category.summary}
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Indicators</h2>
        <p className="text-xs text-faint">
          Default status: {category.defaultStatus.measured} measured ·{" "}
          {category.defaultStatus.estimated} estimated ·{" "}
          {category.defaultStatus.unknown} unknown
        </p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-panel-raised text-left text-[11px] tracking-wider text-faint uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Indicator</th>
              <th className="px-3 py-2 font-medium">Tier</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Effort</th>
              <th className="px-3 py-2 font-medium">Gates</th>
              <th className="px-3 py-2 font-medium">Rollup</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="group relative border-b border-hairline last:border-0 hover:bg-panel-raised/50"
              >
                <td className="px-3 py-2.5 align-top">
                  <Link
                    href={indicatorHref(entry.id)}
                    aria-label={`Open ${entry.id} — ${entry.name}`}
                    className="cursor-pointer rounded font-mono text-xs text-foreground after:absolute after:inset-0 hover:underline hover:underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                  >
                    {entry.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5 align-top text-foreground">
                  {entry.name}
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-xs text-muted">
                  {entry.tier}
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-xs text-muted">
                  {entry.default_status}
                </td>
                <td className="px-3 py-2.5 align-top text-xs text-faint">
                  {entry.effort}
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-xs text-muted">
                  {gatesCell(entry)}
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-xs text-faint">
                  {entry.rollup}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Category navigation"
        className="mt-8 flex flex-wrap justify-between gap-3 border-t border-hairline pt-4 text-sm"
      >
        <span>
          {position > 0 ? (
            <PreviousCategory code={CATEGORY_ORDER[position - 1] ?? ""} />
          ) : null}
        </span>
        <span>
          {position < CATEGORY_ORDER.length - 1 ? (
            <NextCategory code={CATEGORY_ORDER[position + 1] ?? ""} />
          ) : null}
        </span>
      </nav>

      <p className="mt-4 text-xs text-faint">
        <Link
          href={categoryHref(category.code)}
          className="cursor-pointer underline underline-offset-2 hover:text-foreground"
        >
          Link to this category
        </Link>
      </p>
    </div>
  );
}

function PreviousCategory({ code }: { code: string }) {
  const category = categorySummaries().find((entry) => entry.code === code);
  if (!category) return null;
  return (
    <Link
      href={categoryHref(code)}
      className="cursor-pointer underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
    >
      ← {category.prefix} {category.name}
    </Link>
  );
}

function NextCategory({ code }: { code: string }) {
  const category = categorySummaries().find((entry) => entry.code === code);
  if (!category) return null;
  return (
    <Link
      href={categoryHref(code)}
      className="cursor-pointer underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
    >
      {category.prefix} {category.name} →
    </Link>
  );
}
