import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report-view";
import { ScanTraceView } from "@/components/scan-trace-view";
import { getSample, sampleSlugs } from "@/lib/samples";

// Every committed sample is pre-rendered; an unknown slug has no document and
// resolves to the site's not-found page. Rebuilding never changes a path.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return sampleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sample = getSample(slug);
  if (!sample) return { title: "Sample not found" };
  const { report } = sample.envelope;
  return { title: `${report.snapshot.repo} · illustrative sample · LeapScore` };
}

export default async function SampleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sample = getSample(slug);
  if (!sample) notFound();

  const { report, meta, trace } = sample.envelope;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <p className="text-xs font-medium text-tier-moderate">
          Illustrative sample — sealed from a real scan of a checked-in
          synthetic fixture, not a customer scan.
        </p>
        <p className="mt-1 font-mono text-xs text-faint">
          engine {report.snapshot.engine_version} · rubric{" "}
          {report.snapshot.rubric_version} · sealed coverage is the
          sample&apos;s own (the current release has detectors for up to 31 of
          102 indicators: 6 remote + 25 local)
        </p>
      </div>
      <ReportView
        report={report}
        title="Illustrative sample"
        persistedMeta={meta}
      />
      <ScanTraceView trace={trace ?? []} />
    </div>
  );
}
