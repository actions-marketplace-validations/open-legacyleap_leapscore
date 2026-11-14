import type { Metadata } from "next";
import Link from "next/link";

import { coverageClaim } from "@/lib/coverage-claim";
import {
  RUBRIC_INDEX,
  categorySummaries,
  defaultStatusCounts,
  releaseStatusCounts,
} from "@/lib/rubric-index";
import { categoryHref } from "@/lib/rubric-links";
import { RubricSearch } from "./rubric-search";

export const metadata: Metadata = {
  title: "Rubric | LeapScore",
  description:
    "Browse the 102 indicators used to audit codebase maintainability: ten categories, four-level criteria, gates, and detector coverage.",
};

function weightLabel(base: number | null, feActive: number | null): string {
  if (base == null) return `FE-active only · ${feActive ?? "—"}%`;
  return `${base}%${feActive == null ? "" : ` · FE ${feActive}%`}`;
}

export default function RubricPage() {
  const categories = categorySummaries();
  const release = releaseStatusCounts();
  const declared = defaultStatusCounts();
  const claim = coverageClaim();
  const rows = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="text-xs tracking-wider text-faint uppercase">
          The measured set
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          The rubric, in full
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          Every indicator the scan grades is defined here: its 0–3 criteria, its
          flag pair, what a fix looks like, and how a detector proves it. Rows
          show the rubric&apos;s declared measurement mode; the strip below says
          what this release can actually grade.
        </p>
      </header>

      <section
        className="instrument-panel mt-8 rounded-lg p-4"
        aria-labelledby="coverage-heading"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="coverage-heading" className="text-sm font-medium text-ink">
            Coverage in this release
          </h2>
          <span className="font-mono text-xs text-faint">
            {rows} indicator rows
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["measured", "Measured", release.measured],
              ["estimated", "Estimated", release.estimated],
              ["unknown", "Unknown", release.unknown],
              ["not_implemented", "Not implemented", release.not_implemented],
            ] as const
          ).map(([key, label, count]) => (
            <div
              key={key}
              data-status={key}
              className="rounded border border-hairline bg-panel-raised/60 px-3 py-2"
            >
              <dt className="text-[11px] tracking-wider text-faint uppercase">
                {label}
              </dt>
              <dd className="mt-0.5 font-mono text-xl text-foreground tabular-nums">
                {count}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          {claim.sentence} A row with no detector is disclosed as not
          implemented; it never renders a score, a verdict, or a measurement
          claim.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-faint">
          Declared default status (a property of the rubric, not of this
          release): {declared.measured} measured · {declared.estimated}{" "}
          estimated · {declared.unknown} unknown.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="categories-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="categories-heading" className="text-lg font-semibold">
            Categories
          </h2>
          <span className="text-xs text-faint">
            Weights are percent of the system score.
          </span>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
          <table className="w-full text-sm">
            <thead className="bg-panel-raised text-left text-[11px] tracking-wider text-faint uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                  Weight
                </th>
                <th className="px-3 py-2 text-right font-medium">Rows</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">
                  Tier mix
                </th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">
                  Default status
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category.code}
                  className="relative border-b border-hairline last:border-0 hover:bg-panel-raised/50"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={categoryHref(category.code)}
                      className="group flex items-baseline gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                    >
                      <span className="font-mono text-xs text-faint">
                        {category.prefix}
                      </span>
                      <span className="font-medium text-foreground group-hover:underline group-hover:underline-offset-2">
                        {category.name}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-3 py-3 font-mono text-xs text-muted sm:table-cell">
                    {weightLabel(category.baseWeight, category.feActiveWeight)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs text-muted tabular-nums">
                    {category.count}
                  </td>
                  <td className="hidden px-3 py-3 font-mono text-xs text-faint md:table-cell">
                    A {category.tiers.A} · B {category.tiers.B} · C{" "}
                    {category.tiers.C} · D {category.tiers.D}
                  </td>
                  <td className="hidden px-3 py-3 font-mono text-xs text-faint lg:table-cell">
                    {category.defaultStatus.measured}m ·{" "}
                    {category.defaultStatus.estimated}e ·{" "}
                    {category.defaultStatus.unknown}u
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-lg font-semibold">
          Find an indicator
        </h2>
        <p className="mt-1 text-sm text-muted">
          Search every indicator in one list, or narrow by engine tier, default
          status, and gate participation.
        </p>
        <RubricSearch entries={RUBRIC_INDEX} />
      </section>
    </div>
  );
}
