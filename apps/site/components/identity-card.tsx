"use client";

import {
  identityStatusLabel,
  identityValueLabel,
  type ReportIdentity,
} from "@leapscore/contracts";
import type { Report } from "@/lib/types";

/*
 * The identity card — the report's *subject* band (report-identity /
 * report-rendering). It reads the sealed `report.identity` block and the shared
 * contract formatting helpers, and nothing else: no tree walk, no manifest
 * sniff, no scanner import, no filesystem. A pre-change envelope has no block,
 * so the card renders nothing at all.
 */

function githubCommitHref(repo: string, sha: string): string | null {
  const slug = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repo.trim());
  if (!slug) return null;
  return `https://github.com/${slug[1]}/${slug[2]}/commit/${sha}`;
}

function shareLabel(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function planesLabel(planes: Record<string, boolean> | undefined): string {
  if (!planes) return "";
  return Object.entries(planes)
    .filter(([, present]) => present)
    .map(([name]) => name.replace(/^has_/, ""))
    .join(" · ");
}

function linesDetail(identity: ReportIdentity): string {
  const item = identity.size.lines;
  if (!item) return "";
  const bits: string[] = [];
  if (item.scope) bits.push(item.scope);
  if (item.covered && item.covered.files_in_scope > item.covered.files_read) {
    bits.push(`sampled ${item.covered.files_read} of ${item.covered.files_in_scope} files`);
  }
  const status = identityStatusLabel(item);
  const detail = bits.join(" · ");
  return [detail, item.status === "unknown" ? "" : status].filter(Boolean).join(" · ");
}

export function IdentityCard({ report }: { report: Report }) {
  const identity = report.identity;
  if (!identity) return null;

  const { subject, shape, size, stack } = identity;
  // The commit the rest of the report states (`snapshot.scanned_commit`), with
  // the identity subject as the fallback an authored fixture may be the only
  // place to record it. One value, one link (design D8).
  const sealedCommit = report.snapshot.scanned_commit && report.snapshot.scanned_commit !== "unknown"
    ? report.snapshot.scanned_commit
    : subject.commit;
  const commitShort = sealedCommit && sealedCommit !== "unknown" ? sealedCommit.slice(0, 7) : "unknown";
  const commitHref = sealedCommit && sealedCommit !== "unknown"
    ? githubCommitHref(subject.repo, sealedCommit)
    : null;
  // One archetype value: the card reads the sealed `snapshot.archetype` the chip
  // reads (identity.shape mirrors it), so the two cannot disagree.
  const archetype = report.snapshot.archetype ?? shape.archetype;
  const languages = stack.languages.map((l) => `${l.name} ${shareLabel(l.share)}`);
  const ecosystems = stack.ecosystems;
  const frameworks = stack.frameworks;
  const detectedLegacy = (stack.legacy_stacks ?? []).filter((s) => s.detected).map((s) => s.id);
  const planes = planesLabel(shape.planes);

  return (
    <section
      className="mb-8 rounded-lg border border-hairline bg-panel/30 p-4"
      aria-label="Target identity"
      data-testid="identity-card"
    >
      {report.sample ? (
        <p className="mb-3 text-xs font-medium text-tier-moderate">
          Illustrative sample — these figures describe a checked-in synthetic demo target, not a customer scan.
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-muted">
        <span className="text-sm text-foreground">{subject.repo}</span>
        {commitHref ? (
          <a href={commitHref} className="underline underline-offset-2 hover:text-foreground">
            commit {commitShort}
          </a>
        ) : (
          <span>commit {commitShort}</span>
        )}
        <span className="text-faint">{subject.scanned_at}</span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-wider text-faint">Shape</dt>
          <dd className="mt-0.5 text-muted">
            {shape.status === "unknown" ? (
              <span className="text-faint">archetype not measured — {shape.reason ?? "classification did not run"}</span>
            ) : (
              <>
                <span className="font-mono text-foreground">{archetype}</span>
                {shape.confidence ? <span className="text-faint"> ({shape.confidence})</span> : null}
                {planes ? <span className="block text-faint">planes: {planes}</span> : null}
                {shape.per_root && shape.per_root.length > 1 ? (
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {shape.per_root.map((root) => (
                      <span key={root.root} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                        {root.root === "." ? "root" : root.root}: {root.archetype}
                      </span>
                    ))}
                  </span>
                ) : null}
              </>
            )}
          </dd>
        </div>

        <div>
          <dt className="uppercase tracking-wider text-faint">Size</dt>
          <dd className="mt-0.5 text-muted">
            {size.status === "unknown" ? (
              <span className="text-faint">not measured — {size.reason ?? "tree walk did not run"}</span>
            ) : (
              <>
                <span className="font-mono text-foreground">{size.files ?? "—"}</span> files ·{" "}
                <span className="font-mono text-foreground">{size.directories ?? "—"}</span> dirs
                {size.lines ? (
                  <span className="block">
                    <span className="font-mono text-foreground">{identityValueLabel(size.lines)}</span> lines
                    {linesDetail(identity) ? <span className="text-faint"> · {linesDetail(identity)}</span> : null}
                  </span>
                ) : null}
              </>
            )}
          </dd>
        </div>

        <div>
          <dt className="uppercase tracking-wider text-faint">Stack</dt>
          <dd className="mt-0.5 text-muted">
            {stack.status === "unknown" ? (
              <span className="text-faint">not measured — {stack.reason ?? "stack sniff did not run"}</span>
            ) : (
              <>
                {stack.primary_language ? (
                  <span className="block">
                    primary <span className="font-mono text-foreground">{stack.primary_language}</span>
                  </span>
                ) : null}
                {languages.length ? <span className="block text-faint">{languages.join(" · ")}</span> : null}
                {ecosystems.length ? <span className="block">ecosystems: {ecosystems.join(", ")}</span> : null}
                {frameworks.length ? <span className="block">frameworks: {frameworks.join(", ")}</span> : null}
                {detectedLegacy.length ? <span className="block">legacy stacks: {detectedLegacy.join(", ")}</span> : null}
              </>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
