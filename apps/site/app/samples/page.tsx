import type { Metadata } from "next";
import Link from "next/link";

import { listSamples } from "@/lib/samples";
import { publicTierLabel } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Illustrative samples · LeapScore",
  description:
    "Committed sealed envelopes from real scans of checked-in synthetic fixtures — illustrative, not a store of visitor scans.",
};

function coverageLine(coverage: {
  measured: number;
  estimated: number;
  unknown: number;
  not_applicable: number;
  not_implemented?: number;
}): string {
  return [
    `${coverage.measured} measured`,
    `${coverage.estimated} estimated`,
    `${coverage.unknown} unknown`,
    `${coverage.not_applicable} not applicable`,
    `${coverage.not_implemented ?? 0} not implemented`,
  ].join(" · ");
}

function suppressed(report: {
  headline: { suppressed?: boolean; verdict?: string };
}): boolean {
  return (
    report.headline.suppressed === true ||
    String(report.headline.verdict ?? "")
      .trim()
      .toLowerCase() === "insufficient-signal"
  );
}

export default function SamplesPage() {
  const samples = listSamples();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-faint uppercase">
            Illustrative samples
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Committed sample reports
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-faint">
            A set of committed sealed envelopes from real scans of checked-in
            synthetic fixtures. They are illustrative, not a store of visitor
            scans; no repository is scanned to render this page.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm underline underline-offset-2 hover:text-foreground"
        >
          ← Home
        </Link>
      </div>

      {samples.length === 0 ? (
        <div className="rounded-lg border border-hairline p-6">
          <h2 className="text-lg font-semibold">
            No illustrative sample retained
          </h2>
          <p className="mt-2 text-sm text-muted">
            Scan a repository on your own machine to produce a report:{" "}
            <code className="font-mono text-xs">
              npx leapscore-scan . --out leapscore-report
            </code>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-panel/50 text-xs text-faint">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Sample</th>
                <th className="px-3 py-2 text-left font-medium">Score</th>
                <th className="px-3 py-2 text-left font-medium">Tier</th>
                <th className="px-3 py-2 text-left font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {samples.map((sample) => {
                const { report } = sample.envelope;
                const tier =
                  publicTierLabel(report.headline.tier) ?? report.headline.tier;
                return (
                  <tr key={sample.slug} className="hover:bg-panel/30">
                    <td className="px-3 py-2">
                      <span className="rounded border border-hairline px-1.5 py-0.5 text-[10px] tracking-wider text-faint uppercase">
                        illustrative sample
                      </span>{" "}
                      <Link
                        href={`/samples/${sample.slug}`}
                        className="font-mono text-xs text-foreground underline underline-offset-2 hover:text-muted"
                      >
                        {report.snapshot.repo}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {suppressed(report)
                        ? "insufficient signal"
                        : report.headline.score}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {suppressed(report) ? "—" : tier}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {coverageLine(report.coverage)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-faint">
        The coverage counts above belong to each sealed sample. The current
        release has detectors for up to 31 of the 102 indicators — 6 remote
        (GitHub API) and 25 local — and the rest are disclosed as not
        implemented.
      </p>
    </div>
  );
}
